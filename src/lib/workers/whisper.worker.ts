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

declare const self: DedicatedWorkerGlobalScope;
let whisperModule: WhisperModule | null = null;
let wasmInstance: WhisperWasm | null = null;

/**
 * Initialize the Whisper WASM module
 * @param config Module configuration options
 */
async function initializeModule(config: WhisperConfig): Promise<void> {
  try {
    // Load WASM module
    const response = await fetch(config.modelPath);
    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.statusText}`);
    }

    const wasmBinary = await response.arrayBuffer();
    
    // Create module instance
    wasmInstance = await (self as any).createWhisperModule({
      wasmBinary,
      onRuntimeInitialized: () => {
        postMessage({ type: 'MODEL_LOADED' } as WorkerResponse);
      }
    });

    // Initialize module with configuration
    whisperModule = {
      init: async (config) => {
        if (!wasmInstance) throw new Error('WASM module not initialized');
        // Implementation will be added
      },
      processAudio: async (audio) => {
        if (!wasmInstance) throw new Error('WASM module not initialized');
        // Implementation will be added
        return {} as TranscriptionResult;
      },
      getMemoryStats: () => {
        if (!wasmInstance) throw new Error('WASM module not initialized');
        return {
          totalHeap: wasmInstance.HEAP8.length,
          usedHeap: 0, // Will be implemented
          peakMemory: 0 // Will be implemented
        };
      },
      destroy: () => {
        if (wasmInstance) {
          // Cleanup code will be added
          wasmInstance = null;
        }
        whisperModule = null;
      }
    };

  } catch (error) {
    console.error('Failed to initialize Whisper module:', error);
    postMessage({
      type: 'ERROR',
      payload: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
}

/**
 * Handle incoming worker messages
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  try {
    switch (event.data.type) {
      case 'LOAD_MODEL':
        await initializeModule(event.data.payload);
        break;

      case 'PROCESS_AUDIO':
        if (!whisperModule) {
          throw new Error('Whisper module not initialized');
        }
        postMessage({ type: 'PROCESSING_STARTED' } as WorkerResponse);
        
        const result = await whisperModule.processAudio(event.data.payload);
        postMessage({
          type: 'TRANSCRIPTION_RESULT',
          payload: result
        } as WorkerResponse);
        break;

      case 'ABORT':
        if (whisperModule) {
          whisperModule.destroy();
        }
        break;

      case 'RESET':
        if (whisperModule) {
          whisperModule.destroy();
          whisperModule = null;
          wasmInstance = null;
        }
        break;

      default:
        throw new Error('Unknown message type');
    }
  } catch (error) {
    console.error('Worker error:', error);
    postMessage({
      type: 'ERROR',
      payload: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
};

/**
 * Handle worker cleanup
 */
self.addEventListener('unload', () => {
  if (whisperModule) {
    whisperModule.destroy();
  }
});