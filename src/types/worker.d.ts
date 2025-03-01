declare module "*.worker.ts" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module "*.wasm" {
  const content: WebAssembly.Module;
  export default content;
}

declare module "comlink/dist/esm/comlink" {
  export * from "comlink";
}