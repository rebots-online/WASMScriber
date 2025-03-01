'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useWhisper } from '@/lib/contexts/WhisperContext';

const WhisperVoiceRecorder: React.FC = () => {
  const {
    connectToWhisper,
    disconnectFromWhisper,
    isRecording,
    realtimeTranscript,
    error,
    isModelLoading,
  } = useWhisper();

  const handleToggleRecording = async () => {
    if (isRecording) {
      disconnectFromWhisper();
    } else {
      await connectToWhisper();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleToggleRecording}
          disabled={isModelLoading}
          className={`
            relative w-16 h-16 rounded-full
            ${isModelLoading ? 'bg-gray-400 cursor-not-allowed' : 
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
            transition-colors duration-200 flex items-center justify-center
          `}
        >
          {isModelLoading ? (
            <motion.div
              className="w-8 h-8 border-4 border-white rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <div className={`
              ${isRecording ? 'w-6 h-6 bg-white rounded-sm' : 'w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1'}
            `} />
          )}
        </button>

        {isRecording && (
          <motion.div 
            className="w-full h-16 bg-gray-100 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-full h-full flex items-center justify-center"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-8 bg-blue-500 rounded-full"
                    animate={{
                      scaleY: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 0.75,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        <div className="w-full min-h-[200px] bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="prose max-w-none">
            {realtimeTranscript || (
              <p className="text-gray-400 italic">
                {isModelLoading ? 'Loading Whisper model...' : 
                 isRecording ? 'Listening...' : 'Click the button to start recording'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhisperVoiceRecorder;