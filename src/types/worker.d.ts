/**
 * @file worker.d.ts
 * @description Type definitions for Web Workers
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */

/**
 * Extended Worker global scope for Whisper WASM
 */
interface DedicatedWorkerGlobalScope {
  createWhisperModule: EmscriptenModuleFactory;
  postMessage(message: any, transfer?: Transferable[]): void;
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (event: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (event: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

/**
 * Worker factory type for TypeScript Worker construction
 */
declare module "*.worker.ts" {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

/**
 * Transferable objects for optimized worker communication
 */
interface TransferableOptions {
  /** Array of objects to transfer ownership of */
  transfer?: Transferable[];
}