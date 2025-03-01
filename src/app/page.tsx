'use client';

import { WhisperContextProvider } from '@/lib/contexts/WhisperContext';
import WhisperVoiceRecorder from '@/components/WhisperVoiceRecorder';
import db from '@/lib/db/database';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          Voice Notes WASM
        </h1>
        <h2 className="text-xl text-gray-600 text-center mb-12">
          Record and transcribe voice notes using Whisper WASM
        </h2>

        <WhisperContextProvider>
          <WhisperVoiceRecorder />
        </WhisperContextProvider>
      </div>
    </main>
  );
}
