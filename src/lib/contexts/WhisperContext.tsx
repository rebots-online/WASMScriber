'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import * as Comlink from 'comlink';
import type { WhisperWorkerInterface } from '../types/whisper';

interface WhisperContextType {
  connectToWhisper: () => Promise<void>;
  disconnectFromWhisper: () => void;
  isRecording: boolean;
  realtimeTranscript: string;
  error: string | null;
  isModelLoading: boolean;
}

const WhisperContext = createContext<WhisperContextType | undefined>(undefined);

interface WhisperContextProviderProps {
  children: ReactNode;
}

declare global {
  interface Navigator {
    gpu?: {
      requestAdapter(): Promise<{} | null>;
    };
  }
}

/**
 * Determines if the browser supports WebGPU and returns whether GPU acceleration is available
 */
async function hasWebGPUSupport(): Promise<boolean> {
  if (!navigator.gpu) return false;
  
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

// Audio worklet for real-time audio processing
const audioWorklet = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
    this.totalSamples = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;

    // Convert input to mono if necessary
    const monoInput = input.length === 1 ? input[0] : 
      new Float32Array(input[0].length).map((_, i) => 
        input.reduce((sum, channel) => sum + channel[i], 0) / input.length
      );

    this.buffers.push(monoInput.slice());
    this.totalSamples += monoInput.length;

    // Send accumulated audio data when we have enough samples
    if (this.totalSamples >= 16000) { // 1 second of audio at 16kHz
      const completeBuffer = new Float32Array(this.totalSamples);
      let offset = 0;
      for (const buffer of this.buffers) {
        completeBuffer.set(buffer, offset);
        offset += buffer.length;
      }
      
      this.port.postMessage(completeBuffer);
      
      // Reset buffers
      this.buffers = [];
      this.totalSamples = 0;
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
`;

export const WhisperContextProvider: React.FC<WhisperContextProviderProps> = ({ 
  children 
}: WhisperContextProviderProps) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const workerRef = useRef<Comlink.Remote<WhisperWorkerInterface> | null>(null);

  // Initialize WebAssembly worker and audio worklet
  const initialize = useCallback(async () => {
    if (!audioContextRef.current) {
      // Create audio context
      audioContextRef.current = new AudioContext({
        sampleRate: 16000, // Required sample rate for Whisper
        latencyHint: 'interactive'
      });

      // Load audio worklet
      const workletBlob = new Blob([audioWorklet], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(workletBlob);
      await audioContextRef.current.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      // Initialize WebAssembly worker
      const worker = new Worker(
        new URL('../workers/whisper.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerRef.current = Comlink.wrap<WhisperWorkerInterface>(worker);
      await workerRef.current.initialize();

      // Set up transcription callback
      workerRef.current.setTranscriptionCallback(
        Comlink.proxy((text: string) => {
          setRealtimeTranscript(prev => prev + ' ' + text);
        })
      );
    }
  }, []);

  const connectToWhisper = useCallback(async () => {
    try {
      setError(null);
      setRealtimeTranscript('');
      setIsModelLoading(true);

      await initialize();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      if (!audioContextRef.current) {
        throw new Error('Audio context not initialized');
      }

      // Create audio graph
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      workletNodeRef.current = new AudioWorkletNode(
        audioContextRef.current,
        'audio-processor'
      );

      // Process audio data from worklet
      workletNodeRef.current.port.onmessage = async (event) => {
        const audioData = event.data;
        if (workerRef.current) {
          await workerRef.current.processAudioChunk(audioData);
        }
      };

      // Connect audio nodes
      sourceNodeRef.current.connect(workletNodeRef.current);
      workletNodeRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
      setIsModelLoading(false);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
      setIsModelLoading(false);
    }
  }, [initialize]);

  const disconnectFromWhisper = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.mediaStream.getTracks().forEach(track => track.stop());
      sourceNodeRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromWhisper();
      if (workerRef.current) {
        workerRef.current.cleanup();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [disconnectFromWhisper]);

  const contextValue: WhisperContextType = {
    connectToWhisper,
    disconnectFromWhisper,
    isRecording,
    realtimeTranscript,
    error,
    isModelLoading,
  };

  return (
    <WhisperContext.Provider value={contextValue}>
      {children}
    </WhisperContext.Provider>
  );
};

export function useWhisper(): WhisperContextType {
  const context = useContext(WhisperContext);
  if (context === undefined) {
    throw new Error('useWhisper must be used within a WhisperContextProvider');
  }
  return context;
}