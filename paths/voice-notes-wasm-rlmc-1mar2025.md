# Voice Notes App

## Path system prompt:
You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing. 


## App description:
I want to create a voice-based note-taking app. 


## App flow and functionality:

The flow of the app is as follows:
- User opens the app, and there is a play/start button to start recording your voice.
- When the user clicks on the button, it asks for permission to access the microphone.
- If the user clicks allow, the app starts recording and the button changes to a stop button.
- Using whisper v3 via wasm implementation (webgpu, if available), the real-time stream transcription appears in an editor tab based on https://github.com/rebots-online/wscribe-editor
- When the user clicks on the stop button, the app stops recording and unlocks the wscribe-editor interface to allow editing with word-level (or better, if needed) accuracy.
- While the user is speaking, there is a clean, simple animation on the screen along with the realtime transcription of the voice note.
- The user can click the stop button to stop the recording.
- After recording, the note is automatically saved with the date, time, and the transcription of the voice note into the IndexedDB + Dexie.js database.
- Now, the app displays the note in a list of all notes on the home screen.


This application is set-up with existing configuration for Deepgram APIs and Firebase. Implement all the functionality in the flow above while using the existing codebase as a starting point, but fully modify the codebase to fit the flow and functionality described above.

But I want to remove the dependence on the third-party commercial Deepgram API and change it to open-source-based Whisper WASM (see sample implementation at https://github.com/ggerganov/whisper.cpp/tree/master/examples/stream.wasm) and remove the dependence on firebase, replacing it with IndexedDB with Dexie.js for a local storage, with export/share to json, text, html, and markdown as options.
