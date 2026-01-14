#!/bin/bash
# Regenerate all GIFs from frames directories
# Usage: ./scripts/regenerate-all-gifs.sh [fps]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/test-output"
FPS="${1:-2}"

echo "=== Regenerating all GIFs at ${FPS}fps ==="
echo ""

cd "$PROJECT_DIR"

# Find all *-frames directories and generate corresponding GIFs
for frames_dir in "$OUTPUT_DIR"/*-frames; do
  if [ -d "$frames_dir" ]; then
    # Extract name (e.g., "add-task" from "add-task-frames")
    dir_name=$(basename "$frames_dir")
    name="${dir_name%-frames}"
    output="$OUTPUT_DIR/${name}.gif"

    echo "=== $name ==="
    "$SCRIPT_DIR/generate-gif.sh" "$frames_dir" "$output" "$FPS"
    echo ""
  fi
done

echo "=== All GIFs regenerated ==="
