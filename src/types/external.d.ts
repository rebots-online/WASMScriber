/**
 * @file external.d.ts
 * @description Type declarations for external modules and libraries
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */

declare interface EmscriptenModule {
  // Memory
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  // Memory management
  _malloc(size: number): number;
  _free(ptr: number): void;

  // Module lifecycle
  onRuntimeInitialized?: () => void;
  then?(fn: (module: EmscriptenModule) => void): Promise<EmscriptenModule>;

  // Optional WebAssembly instance
  wasmMemory?: WebAssembly.Memory;
  wasmTable?: WebAssembly.Table;

  // Stack management
  stackAlloc(size: number): number;
  stackSave(): number;
  stackRestore(ptr: number): void;

  // UTF conversion helpers
  UTF8ToString(ptr: number, maxBytesToRead?: number): string;
  stringToUTF8(str: string, outPtr: number, maxBytesToWrite?: number): void;
}

declare interface EmscriptenModuleFactory {
  (config?: EmscriptenModuleConfig): Promise<EmscriptenModule>;
}

interface EmscriptenModuleConfig {
  locateFile?(path: string, prefix: string): string;
  mainScriptUrlOrBlob?: string;
  print?(str: string): void;
  printErr?(str: string): void;
  wasmBinary?: ArrayBuffer;
  wasmMemory?: WebAssembly.Memory;
  wasmTable?: WebAssembly.Table;
  [key: string]: any;
}