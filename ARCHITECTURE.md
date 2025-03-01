# Voice Notes WASM - Application Architecture

## Overview

Voice Notes WASM is a Next.js application that allows users to record voice notes and have them transcribed in real-time using Whisper WASM, a WebAssembly implementation of OpenAI's Whisper model. The app stores notes locally using IndexedDB/Dexie.js and provides export functionality in various formats.

## Key Technologies

- **Next.js & React**: Frontend framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Styling
- **Whisper WASM**: Local speech-to-text processing
- **Dexie.js**: IndexedDB wrapper for local data storage
- **wscribe-editor**: Word-level accurate transcript editor

## System Architecture

### Components

1. **Core Framework**
   - Next.js App Router structure
   - React components

2. **Data Layer**
   - IndexedDB via Dexie.js
   - Data models (Note, User preferences)
   - Export functionality (JSON, Text, HTML, Markdown)

3. **Voice Processing**
   - Whisper WASM integration
   - Audio recording and streaming
   - Real-time transcription

4. **User Interface**
   - Recording controls
   - Transcription editor (wscribe-editor)
   - Notes list and management
   - Export interface

## Component Details

### WhisperContext (replacing DeepgramContext)

A React context provider that handles:
- Loading Whisper WASM model
- Recording audio from the microphone
- Processing audio through Whisper
- Streaming real-time transcription results
- WebGPU detection and fallbacks

### Database Service (replacing Firebase)

- Dexie.js implementation for IndexedDB
- Schema definitions
- CRUD operations for notes
- Backup and restore functionality

### Editor Integration

- Integration with wscribe-editor
- Word-level editing capability
- Styling and customization

### Recording Component

- Microphone permission handling
- Recording state management
- Visualization of audio input
- Start/stop controls

### Notes Management

- List of saved notes with timestamps
- Filtering and searching
- Delete and edit operations

### Export Service

- Convert notes to different formats
- Download functionality
- Share options

## Data Flow

1. **Recording Flow**
   - User initiates recording
   - Audio is captured and streamed to Whisper WASM
   - Real-time transcription displayed in editor
   - On stop, transcription is finalized and saved

2. **Storage Flow**
   - Notes auto-saved to IndexedDB
   - Notes retrieved on app start
   - Changes synchronized with local storage

3. **Export Flow**
   - User selects note(s) to export
   - User selects format
   - System generates formatted output
   - User downloads or shares the result

## Technical Considerations

### Whisper WASM Integration

- Model loading and initialization
- WebGPU acceleration where available
- Fallback to WebAssembly when WebGPU isn't available
- Memory management for efficient processing

### IndexedDB/Dexie.js Implementation

- Schema versioning for future updates
- Efficient querying and indexing
- Error handling and recovery

### Performance Optimization

- Lazy loading of components and models
- Efficient memory usage during transcription
- UI responsiveness during processing

### Browser Compatibility

- Feature detection for required APIs
- Fallbacks for unsupported features
- Responsive design for different devices