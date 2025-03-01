/**
 * @file WhisperContext.tsx
 * @description React context for managing Whisper WASM workers
 * @copyright (C) 2025 Robin L. M. Cheung, MBA
 */

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  useState
} from 'react';
import WhisperWorker from '@/lib/workers/whisper.worker';
import type {
  WhisperConfig,
  WorkerMessage,
  WorkerResponse,
  TranscriptionResult
} from '@/lib/types/whisper';

interface WhisperContextType {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  transcribe: (audio: Float32Array) => Promise<TranscriptionResult>;
  initialize: (config: WhisperConfig) => Promise<void>;
  cleanup: () => void;
}

const WhisperContext = createContext<WhisperContextType | null>(null);

const MAX_WORKERS = navigator.hardwareConcurrency || 4;
const WORKER_TIMEOUT = 30000; // 30 seconds

interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  lastUsed: number;
}

export function WhisperProvider({ children }: { children: ReactNode }) {
  const workersRef = useRef<WorkerInstance[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configRef = useRef<WhisperConfig | null>(null);

  // Initialize a new worker
  const createWorker = useCallback(async (config: WhisperConfig) => {
    const worker = new WhisperWorker();
    
    return new Promise<WorkerInstance>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker initialization timeout'));
      }, WORKER_TIMEOUT);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'MODEL_LOADED') {
          clearTimeout(timeoutId);
          resolve({
            worker,
            busy: false,
            lastUsed: Date.now()
          });
        } else if (event.data.type === 'ERROR') {
          clearTimeout(timeoutId);
          reject(new Error(event.data.payload));
        }
      };

      worker.postMessage({
        type: 'LOAD_MODEL',
        payload: config
      } as WorkerMessage);
    });
  }, []);

  // Get an available worker or create a new one
  const getWorker = useCallback(async (): Promise<WorkerInstance> => {
    if (!configRef.current) {
      throw new Error('Whisper context not initialized');
    }

    // Find available worker
    const availableWorker = workersRef.current.find(w => !w.busy);
    if (availableWorker) {
      availableWorker.busy = true;
      availableWorker.lastUsed = Date.now();
      return availableWorker;
    }

    // Create new worker if under limit
    if (workersRef.current.length < MAX_WORKERS) {
      const newWorker = await createWorker(configRef.current);
      workersRef.current.push(newWorker);
      newWorker.busy = true;
      return newWorker;
    }

    // Wait for a worker to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const worker = workersRef.current.find(w => !w.busy);
        if (worker) {
          clearInterval(checkInterval);
          worker.busy = true;
          worker.lastUsed = Date.now();
          resolve(worker);
        }
      }, 100);
    });
  }, [createWorker]);

  // Initialize the context
  const initialize = useCallback(async (config: WhisperConfig) => {
    try {
      configRef.current = config;
      const initialWorker = await createWorker(config);
      workersRef.current = [initialWorker];
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Whisper');
      throw err;
    }
  }, [createWorker]);

  // Transcribe audio
  const transcribe = useCallback(async (audio: Float32Array): Promise<TranscriptionResult> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const workerInstance = await getWorker();
      
      const result = await new Promise<TranscriptionResult>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Transcription timeout'));
        }, WORKER_TIMEOUT);

        workerInstance.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'TRANSCRIPTION_RESULT') {
            clearTimeout(timeoutId);
            resolve(event.data.payload);
          } else if (event.data.type === 'ERROR') {
            clearTimeout(timeoutId);
            reject(new Error(event.data.payload));
          }
        };

        workerInstance.worker.postMessage({
          type: 'PROCESS_AUDIO',
          payload: audio
        } as WorkerMessage);
      });

      workerInstance.busy = false;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [getWorker]);

  // Cleanup workers
  const cleanup = useCallback(() => {
    workersRef.current.forEach(({ worker }) => {
      worker.postMessage({ type: 'ABORT' } as WorkerMessage);
      worker.terminate();
    });
    workersRef.current = [];
    setIsInitialized(false);
    setIsProcessing(false);
    setError(null);
    configRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const value = {
    isInitialized,
    isProcessing,
    error,
    transcribe,
    initialize,
    cleanup
  };

  return (
    <WhisperContext.Provider value={value}>
      {children}
    </WhisperContext.Provider>
  );
}

export function useWhisper() {
  const context = useContext(WhisperContext);
  if (!context) {
    throw new Error('useWhisper must be used within a WhisperProvider');
  }
  return context;
}