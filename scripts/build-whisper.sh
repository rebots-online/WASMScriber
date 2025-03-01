#!/bin/bash

# Ensure the script fails on any error
set -e

# Create required directories
mkdir -p public

# Navigate to whisper.cpp directory
if [ ! -d "whisper.cpp" ]; then
  git clone https://github.com/rebots-online/whisper.cpp.git
  cd whisper.cpp
else
  cd whisper.cpp
  git pull origin main
fi

# Download the tiny model if it doesn't exist
if [ ! -f "models/ggml-tiny.en.bin" ]; then
  bash ./models/download-ggml-model.sh tiny.en
fi

# Install Emscripten if not already installed
if ! command -v emcc &> /dev/null; then
  git clone https://github.com/emscripten-core/emsdk.git
  cd emsdk
  ./emsdk install latest
  ./emsdk activate latest
  source ./emsdk_env.sh
  cd ..
fi

# Copy source files to top level for building
cp examples/stream.wasm/emscripten.cpp ./stream_wasm.cpp
cp whisper.cpp ./
cp ggml.c ./

# Build Whisper WASM
emcc -O3 \
  -DGGML_USE_ACCELERATE \
  -pthread \
  stream_wasm.cpp \
  whisper.cpp \
  ggml.c \
  -I . \
  -s TOTAL_MEMORY=64MB \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -s EXPORTED_FUNCTIONS='["_malloc", "_free", "_whisper_init", "_whisper_process", "_whisper_get_text", "_whisper_free_text", "_whisper_cleanup"]' \
  -s ASSERTIONS=1 \
  -s WASM=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s "EXPORT_NAME='whisper'" \
  -s MODULARIZE=1 \
  -s ENVIRONMENT='web' \
  -s FILESYSTEM=0 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s USE_PTHREADS=1 \
  -s PTHREAD_POOL_SIZE=4 \
  -o ../public/whisper.js

echo "Build complete! Whisper WASM module is in public/whisper.js"

# Copy model to public directory
cp models/ggml-tiny.en.bin ../public/

echo "Copied Whisper model to public directory"

# Return to original directory
cd ..