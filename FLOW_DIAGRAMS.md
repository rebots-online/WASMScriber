# WASMScriber Flow Diagrams

## System Architecture
```mermaid
graph TD
    subgraph Browser
        A[Audio Input] --> B[MediaRecorder API]
        B --> C[WhisperVoiceRecorder]
        C --> D[Audio Buffer]
        D --> E[Web Worker]
        E --> F[WASM Module]
        F --> G[Transcription]
        G --> H[UI Update]
    end

    subgraph Context Management
        I[WhisperContext] --> J[Worker Pool]
        J --> E
        I --> K[State Management]
        K --> C
    end

    subgraph Build System
        L[whisper.cpp] --> M[Emscripten]
        M --> N[WASM Module]
        N --> F
    end
```

## Initialization Flow
```mermaid
sequenceDiagram
    participant App
    participant Context
    participant Worker
    participant WASM
    
    App->>Context: Initialize WhisperContext
    Context->>Worker: Create Worker Pool
    Worker->>WASM: Load WASM Module
    WASM-->>Worker: Module Ready
    Worker-->>Context: Workers Initialized
    Context-->>App: Ready for Transcription
```

## Recording Flow
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Recorder
    participant Worker
    participant WASM

    User->>UI: Start Recording
    UI->>Recorder: Initialize MediaRecorder
    Recorder->>Recorder: Collect Audio Data
    User->>UI: Stop Recording
    UI->>Worker: Send Audio Data
    Worker->>WASM: Process Audio
    WASM-->>Worker: Return Transcription
    Worker-->>UI: Update Display
```

## Memory Management
```mermaid
flowchart LR
    A[Audio Input] --> B[Buffer Pool]
    B --> C{Size Check}
    C -->|Under Limit| D[Process]
    C -->|Over Limit| E[Clear Old]
    E --> D
    D --> F[Release Memory]
```

## Error Handling
```mermaid
flowchart TD
    A[Operation] --> B{Error Check}
    B -->|No Error| C[Continue]
    B -->|Error| D[Error Handler]
    D --> E{Error Type}
    E -->|WASM| F[Reload Module]
    E -->|Worker| G[Restart Worker]
    E -->|Memory| H[Clear Memory]
    F --> I[Resume]
    G --> I
    H --> I
```

## Development Workflow
```mermaid
gitGraph
    commit id: "initial"
    commit id: "setup"
    branch feature/wasm
    commit id: "wasm-setup"
    commit id: "worker-impl"
    checkout main
    merge feature/wasm
    commit id: "release"
```

---
Copyright (C) 2025 Robin L. M. Cheung, MBA