# Voice Notes WASM

A voice-based note-taking application built with Next.js, featuring real-time transcription using Whisper WASM and local storage with IndexedDB/Dexie.js.

## Features

- **Real-time Voice Transcription**: Record voice notes and see the transcription appear in real-time
- **Local Processing**: Uses Whisper WASM for on-device speech-to-text processing without sending data to external servers
- **WebGPU Acceleration**: Utilizes WebGPU when available for faster transcription processing
- **Word-Level Editing**: Edit transcriptions with word-level accuracy using wscribe-editor
- **Offline Capability**: Works without an internet connection after initial load
- **Local Storage**: All notes are stored locally in your browser using IndexedDB
- **Export Options**: Export your notes as JSON, Text, HTML, or Markdown files
- **Clean UI**: Simple, intuitive interface with visual feedback during recording