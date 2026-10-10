#!/bin/bash
set -e

echo "===================================================="
echo "Building OmniFind HNSW Vector Search Engine to WebAssembly"
echo "===================================================="

if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten (emcc) was not found in PATH."
    echo "Please install Emscripten SDK or use the built-in browser WebAssembly runtime."
    exit 1
fi

echo "Compiling hnsw_engine.cpp ..."
emcc -O3 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_hnsw_create', '_hnsw_free', '_hnsw_set_metric', '_hnsw_add_item', '_hnsw_search_knn', '_hnsw_get_stats']" \
  -s EXPORTED_RUNTIME_METHODS="['cwrap', 'getValue', 'setValue']" \
  -s ALLOW_MEMORY_GROWTH=1 \
  hnsw_engine.cpp -o hnsw_core.js

echo "Compilation successful! Generated hnsw_core.wasm and hnsw_core.js."
