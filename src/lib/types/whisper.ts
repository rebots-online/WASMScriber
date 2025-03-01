/**
 * @file whisper.ts
 * @description TypeScript definitions for Whisper WASM module interactions
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */

/**
 * Configuration options for Whisper model
 */
export interface WhisperConfig {
  /** Path to the model file */
  modelPath: string;
  /** Number of processing threads */
  numThreads?: number;
  /** Language code for transcription */
  language?: string;
  /** Enable translation to English */
  translate?: boolean;
  /** Print progress information */
  printProgress?: boolean;
  /** Print special tokens */
  printSpecial?: boolean;
  /** Print timestamps */
  printTimestamps?: boolean;
}

/**
 * Transcription segment with timing information
 */
export interface TranscriptionSegment {
  /** Start time in milliseconds */
  start: number;
  /** End time in milliseconds */
  end: number;
  /** Transcribed text */
  text: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Speaker ID if available */
  speaker?: number;
}

/**
 * Complete transcription result
 */
export interface TranscriptionResult {
  /** Array of transcription segments */
  segments: TranscriptionSegment[];
  /** Total duration in milliseconds */
  duration: number;
  /** Language detected or used */
  language: string;
  /** Model used for transcription */
  model: string;
}

/**
 * Worker message types for audio processing
 */
export type WorkerMessage =
  | { type: 'LOAD_MODEL'; payload: WhisperConfig }
  | { type: 'PROCESS_AUDIO'; payload: Float32Array }
  | { type: 'ABORT' }
  | { type: 'RESET' };

/**
 * Worker response types
 */
export type WorkerResponse =
  | { type: 'MODEL_LOADED' }
  | { type: 'PROCESSING_STARTED' }
  | { type: 'PROCESSING_PROGRESS'; payload: number }
  | { type: 'TRANSCRIPTION_RESULT'; payload: TranscriptionResult }
  | { type: 'ERROR'; payload: string };

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /** Total heap size in bytes */
  totalHeap: number;
  /** Used heap size in bytes */
  usedHeap: number;
  /** Peak memory usage in bytes */
  peakMemory: number;
}

/**
 * WASM module interface
 */
export interface WhisperModule {
  /** Initialize the module */
  init(config: WhisperConfig): Promise<void>;
  /** Process audio data */
  processAudio(audio: Float32Array): Promise<TranscriptionResult>;
  /** Get current memory statistics */
  getMemoryStats(): MemoryStats;
  /** Clean up resources */
  destroy(): void;
}

/**
 * WebAssembly exports interface
 */
export interface WhisperWasm extends EmscriptenModule {
  _malloc(size: number): number;
  _free(ptr: number): void;
  _processAudio(audioPtr: number, length: number, configPtr: number): number;
  _getTranscription(ptr: number): number;
  _freeTranscription(ptr: number): void;
  HEAPF32: Float32Array;
  HEAPU8: Uint8Array;
}