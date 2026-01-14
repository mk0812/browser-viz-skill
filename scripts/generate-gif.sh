#!/bin/bash
# Generate GIF from frames directory
# Usage: ./scripts/generate-gif.sh <frames-dir> <output.gif> [fps]
#
# Example: ./scripts/generate-gif.sh test-output/add-task-frames test-output/add-task.gif 2

set -e

FRAMES_DIR="$1"
OUTPUT="$2"
FPS="${3:-2}"

if [ -z "$FRAMES_DIR" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: $0 <frames-dir> <output.gif> [fps]"
  echo "Example: $0 test-output/add-task-frames test-output/add-task.gif 2"
  exit 1
fi

if [ ! -d "$FRAMES_DIR" ]; then
  echo "Error: Directory $FRAMES_DIR does not exist"
  exit 1
fi

# Create temp directory for selected frames
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Selecting frames from $FRAMES_DIR..."

# Get all PNG files, sort by name, prefer annotated over raw
counter=1
prev_base=""

for file in $(ls "$FRAMES_DIR"/*.png 2>/dev/null | sort); do
  filename=$(basename "$file")

  # Extract the base name (e.g., "003-03-typed-title" from "003-03-typed-title-raw.png")
  if [[ "$filename" == *"-raw.png" ]]; then
    base="${filename%-raw.png}"
    is_raw=true
  else
    base="${filename%.png}"
    is_raw=false
  fi

  # Skip raw file if annotated version exists
  if [ "$is_raw" = true ]; then
    annotated_file="$FRAMES_DIR/${base}.png"
    if [ -f "$annotated_file" ]; then
      echo "  Skipping $filename (annotated version exists)"
      continue
    fi
  fi

  # Skip if we already processed this base (annotated version)
  if [ "$base" = "$prev_base" ]; then
    continue
  fi
  prev_base="$base"

  # Copy to temp dir with sequential naming
  padded=$(printf "%03d" $counter)
  cp "$file" "$TEMP_DIR/frame-${padded}.png"
  echo "  [$padded] $filename"
  ((counter++))
done

TOTAL_FRAMES=$((counter - 1))
echo ""
echo "Selected $TOTAL_FRAMES frames"

if [ "$TOTAL_FRAMES" -eq 0 ]; then
  echo "Error: No frames found"
  exit 1
fi

echo "Generating GIF at ${FPS}fps..."

# Generate GIF with ffmpeg (single-pass with good quality settings)
ffmpeg -y -framerate "$FPS" \
  -i "$TEMP_DIR/frame-%03d.png" \
  -vf "scale=800:-1:flags=lanczos" \
  -gifflags +transdiff \
  -loop 0 \
  "$OUTPUT" 2>/dev/null

echo "Generated: $OUTPUT"
echo "Done!"
