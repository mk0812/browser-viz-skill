/**
 * Annotator - Add visual annotations to screenshots
 * Supports: red frame highlight, zoom/focus
 */

import sharp from "sharp";
import type { BoundingBox, AnnotationOptions, ZoomOptions } from "./types.js";

const DEFAULT_ANNOTATION: Required<AnnotationOptions> = {
  borderColor: "#FF0000",
  borderWidth: 3,
  padding: 5,
};

const DEFAULT_ZOOM: Required<ZoomOptions> = {
  scale: 2,
  padding: 50,
  outputWidth: 0,
  outputHeight: 0,
};

/**
 * Add red frame highlight around a bounding box
 */
export async function addHighlight(
  imagePath: string,
  box: BoundingBox,
  options: AnnotationOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_ANNOTATION, ...options };

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  // Calculate highlight rectangle with padding
  const x = Math.max(0, box.x - opts.padding);
  const y = Math.max(0, box.y - opts.padding);
  const width = Math.min(
    metadata.width - x,
    box.width + opts.padding * 2
  );
  const height = Math.min(
    metadata.height - y,
    box.height + opts.padding * 2
  );

  // Create SVG overlay with red rectangle
  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        fill="none"
        stroke="${opts.borderColor}"
        stroke-width="${opts.borderWidth}"
        rx="4"
        ry="4"
      />
    </svg>
  `;

  return image
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}

/**
 * Add red frame highlight from raw image buffer
 */
export async function addHighlightToBuffer(
  imageBuffer: Buffer,
  box: BoundingBox,
  options: AnnotationOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_ANNOTATION, ...options };

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const x = Math.max(0, box.x - opts.padding);
  const y = Math.max(0, box.y - opts.padding);
  const width = Math.min(metadata.width - x, box.width + opts.padding * 2);
  const height = Math.min(metadata.height - y, box.height + opts.padding * 2);

  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        fill="none"
        stroke="${opts.borderColor}"
        stroke-width="${opts.borderWidth}"
        rx="4"
        ry="4"
      />
    </svg>
  `;

  return image
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}

/**
 * Zoom into a specific area of the image
 */
export async function zoomToArea(
  imagePath: string,
  box: BoundingBox,
  options: ZoomOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_ZOOM, ...options };

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  // Calculate crop area with padding
  const cropX = Math.max(0, box.x - opts.padding);
  const cropY = Math.max(0, box.y - opts.padding);
  const cropWidth = Math.min(
    metadata.width - cropX,
    box.width + opts.padding * 2
  );
  const cropHeight = Math.min(
    metadata.height - cropY,
    box.height + opts.padding * 2
  );

  // Calculate output dimensions
  const outputWidth = opts.outputWidth || Math.round(cropWidth * opts.scale);
  const outputHeight = opts.outputHeight || Math.round(cropHeight * opts.scale);

  return image
    .extract({
      left: Math.round(cropX),
      top: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    })
    .resize(outputWidth, outputHeight, {
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();
}

/**
 * Zoom into area from buffer
 */
export async function zoomToAreaFromBuffer(
  imageBuffer: Buffer,
  box: BoundingBox,
  options: ZoomOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_ZOOM, ...options };

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const cropX = Math.max(0, box.x - opts.padding);
  const cropY = Math.max(0, box.y - opts.padding);
  const cropWidth = Math.min(
    metadata.width - cropX,
    box.width + opts.padding * 2
  );
  const cropHeight = Math.min(
    metadata.height - cropY,
    box.height + opts.padding * 2
  );

  const outputWidth = opts.outputWidth || Math.round(cropWidth * opts.scale);
  const outputHeight = opts.outputHeight || Math.round(cropHeight * opts.scale);

  return image
    .extract({
      left: Math.round(cropX),
      top: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    })
    .resize(outputWidth, outputHeight, {
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();
}

/**
 * Highlight and zoom combined - highlight the area, then zoom
 */
export async function highlightAndZoom(
  imagePath: string,
  box: BoundingBox,
  annotationOptions: AnnotationOptions = {},
  zoomOptions: ZoomOptions = {}
): Promise<Buffer> {
  // First add highlight
  const highlighted = await addHighlight(imagePath, box, annotationOptions);
  // Then zoom
  return zoomToAreaFromBuffer(highlighted, box, zoomOptions);
}

/**
 * Save buffer to file
 */
export async function saveImage(
  buffer: Buffer,
  outputPath: string
): Promise<void> {
  await sharp(buffer).toFile(outputPath);
}
