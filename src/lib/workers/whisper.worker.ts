/**
 * @file whisper.worker.ts
 * @description Web Worker for handling Whisper WASM transcription
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */

import type {
  WhisperConfig,
  WhisperModule,
  WhisperWasm,
  WorkerMessage,
  WorkerResponse,
  TranscriptionResult
} from '@/lib/types/whisper';

class WhisperWorker {
  private whisperModule: WhisperModule | null = null;
  private wasmInstance: WhisperWasm | null = null;

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
    self.addEventListener('unload', this.cleanup.bind(this));
  }

  /**
   * Initialize the Whisper WASM module
   * @param config Module configuration options
   */
  private async initializeModule(config: WhisperConfig): Promise<void> {
    try {
      // Load WASM module
      const response = await fetch(config.modelPath);
      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.statusText}`);
      }

      const wasmBinary = await response.arrayBuffer();
      
      // Create module instance
      this.wasmInstance = await (self as any).createWhisperModule({
        wasmBinary,
        onRuntimeInitialized: () => {
          self.postMessage({ type: 'MODEL_LOADED' } as WorkerResponse);
        }
      });

      // Initialize module with configuration
      this.whisperModule = {
        init: async (config) => {
          if (!this.wasmInstance) throw new Error('WASM module not initialized');
          // Implementation will be added
        },
        processAudio: async (audio) => {
          if (!this.wasmInstance) throw new Error('WASM module not initialized');
          // Implementation will be added
          return {} as TranscriptionResult;
        },
        getMemoryStats: () => {
          if (!this.wasmInstance) throw new Error('WASM module not initialized');
          return {
            totalHeap: this.wasmInstance.HEAP8.length,
            usedHeap: 0, // Will be implemented
            peakMemory: 0 // Will be implemented
          };
        },
        destroy: () => {
          if (this.wasmInstance) {
            // Cleanup code will be added
            this.wasmInstance = null;
          }
          this.whisperModule = null;
        }
      };

    } catch (error) {
      console.error('Failed to initialize Whisper module:', error);
      self.postMessage({
        type: 'ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error'
      } as WorkerResponse);
    }
  }

  /**
   * Handle incoming worker messages
   */
  private async handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    try {
      switch (event.data.type) {
        case 'LOAD_MODEL':
          await this.initializeModule(event.data.payload);
          break;

        case 'PROCESS_AUDIO':
          if (!this.whisperModule) {
            throw new Error('Whisper module not initialized');
          }
          self.postMessage({ type: 'PROCESSING_STARTED' } as WorkerResponse);
          
          const result = await this.whisperModule.processAudio(event.data.payload);
          self.postMessage({
            type: 'TRANSCRIPTION_RESULT',
            payload: result
          } as WorkerResponse);
          break;

        case 'ABORT':
          this.cleanup();
          break;

        case 'RESET':
          this.cleanup();
          break;

        default:
          throw new Error('Unknown message type');
      }
    } catch (error) {
      console.error('Worker error:', error);
      self.postMessage({
        type: 'ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error'
      } as WorkerResponse);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.whisperModule) {
      this.whisperModule.destroy();
      this.whisperModule = null;
      this.wasmInstance = null;
    }
  }
}

// Create worker instance
new WhisperWorker();

// Export for TypeScript module system
export default null as any;