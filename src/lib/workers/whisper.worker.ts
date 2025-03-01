import * as Comlink from 'comlink';
import type { WhisperWorkerInterface } from '../types/whisper';

// Audio processing constants
const SAMPLE_RATE = 16000;
const AUDIO_SAMPLES = 480000; // 30 seconds of audio at 16kHz
const VAD_THRESHOLD = 0.3;

interface WhisperWorkerState {
  audioBuffer: Float32Array;
  currentPosition: number;
  isProcessing: boolean;
  wasmInstance: WebAssembly.Instance | null;
  wasmMemory: WebAssembly.Memory | null;
}

class WhisperWorker implements WhisperWorkerInterface {
  private state: WhisperWorkerState = {
    audioBuffer: new Float32Array(AUDIO_SAMPLES),
    currentPosition: 0,
    isProcessing: false,
    wasmInstance: null,
    wasmMemory: null,
  };

  private transcriptionCallback: ((text: string) => void) | null = null;

  async initialize(): Promise<void> {
    try {
      const response = await fetch('/whisper.wasm');
      const wasmBuffer = await response.arrayBuffer();
      const wasmMemory = new WebAssembly.Memory({
        initial: 1024,
        maximum: 2048,
        shared: true
      });

      const importObject = {
        env: {
          memory: wasmMemory,
          // Implement required WASM imports based on whisper.cpp/examples/stream.wasm/emscripten.cpp
          now: () => performance.now(),
          log_printf: (fmt: number, ...args: any[]) => {
            console.log("WASM:", ...args);
            return 0;
          }
        }
      };

      const wasmModule = await WebAssembly.instantiate(wasmBuffer, importObject);
      this.state.wasmInstance = wasmModule.instance;
      this.state.wasmMemory = wasmMemory;

      // Initialize the Whisper model
      const result = (this.state.wasmInstance.exports.whisper_init as Function)();
      if (result !== 0) {
        throw new Error('Failed to initialize Whisper model');
      }
    } catch (error) {
      console.error('Failed to initialize WebAssembly module:', error);
      throw error;
    }
  }

  setTranscriptionCallback(callback: (text: string) => void): void {
    this.transcriptionCallback = callback;
  }

  async processAudioChunk(audioData: Float32Array): Promise<void> {
    if (this.state.isProcessing) {
      return;
    }

    // Copy new audio data into our circular buffer
    const remainingSpace = AUDIO_SAMPLES - this.state.currentPosition;
    if (audioData.length <= remainingSpace) {
      this.state.audioBuffer.set(audioData, this.state.currentPosition);
      this.state.currentPosition += audioData.length;
    } else {
      // Buffer is full, process it
      this.state.isProcessing = true;
      await this.processBuffer();
      
      // Reset buffer and add remaining audio
      this.state.currentPosition = 0;
      this.state.audioBuffer.set(audioData);
      this.state.currentPosition = audioData.length;
    }

    // Check if we have enough audio for processing
    if (this.state.currentPosition >= AUDIO_SAMPLES) {
      this.state.isProcessing = true;
      await this.processBuffer();
      this.state.currentPosition = 0;
    }
  }

  private async processBuffer(): Promise<void> {
    if (!this.state.wasmInstance || !this.state.wasmMemory) {
      throw new Error('WASM not initialized');
    }

    try {
      // Get pointer to WASM memory for audio data
      const audioPtr = (this.state.wasmInstance.exports.malloc as Function)(
        this.state.audioBuffer.length * Float32Array.BYTES_PER_ELEMENT
      );

      // Copy audio data to WASM memory
      new Float32Array(
        this.state.wasmMemory.buffer,
        audioPtr,
        this.state.audioBuffer.length
      ).set(this.state.audioBuffer);

      // Process audio through Whisper
      const result = (this.state.wasmInstance.exports.whisper_process as Function)(
        audioPtr,
        this.state.currentPosition,
        SAMPLE_RATE
      );

      if (result !== 0) {
        throw new Error('Failed to process audio');
      }

      // Get transcription result
      const textPtr = (this.state.wasmInstance.exports.whisper_get_text as Function)();
      const textView = new Uint8Array(this.state.wasmMemory.buffer);
      let text = '';
      let i = textPtr;
      while (textView[i] !== 0) {
        text += String.fromCharCode(textView[i]);
        i++;
      }

      // Free WASM memory
      (this.state.wasmInstance.exports.free as Function)(audioPtr);
      (this.state.wasmInstance.exports.whisper_free_text as Function)(textPtr);

      if (text && this.transcriptionCallback) {
        this.transcriptionCallback(text);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    } finally {
      this.state.isProcessing = false;
    }
  }

  async cleanup(): Promise<void> {
    if (this.state.wasmInstance) {
      (this.state.wasmInstance.exports.whisper_cleanup as Function)();
    }
  }
}

Comlink.expose(WhisperWorker);

export type { WhisperWorkerInterface };