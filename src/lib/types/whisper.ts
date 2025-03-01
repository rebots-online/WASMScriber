export interface WhisperWorkerInterface {
  initialize(): Promise<void>;
  setTranscriptionCallback(callback: (text: string) => void): void;
  processAudioChunk(audioData: Float32Array): Promise<void>;
  cleanup(): Promise<void>;
}