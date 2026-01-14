/**
 * Annotator - Add visual annotations to screenshots
 * Supports: highlight (multi-color), arrows, text labels, zoom/focus
 */

import sharp from "sharp";
import type {
  BoundingBox,
  AnnotationOptions,
  ZoomOptions,
  Point,
  ArrowOptions,
  ArrowDirection,
  TextLabelOptions,
  LabelPosition,
  MultiAnnotationOptions,
  ColorName,
} from "./types.js";
import { COLOR_PRESETS } from "./types.js";

/**
 * Resolve color name to hex code
 */
export function resolveColor(color: string | ColorName): string {
  if (color in COLOR_PRESETS) {
    return COLOR_PRESETS[color as ColorName];
  }
  return color;
}

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

const DEFAULT_ARROW: Required<ArrowOptions> = {
  color: "#FF0000",
  strokeWidth: 3,
  headSize: 12,
  length: 60,
  direction: "top" as ArrowDirection,
  from: { x: 0, y: 0 },
};

const DEFAULT_TEXT_LABEL: Required<TextLabelOptions> = {
  textColor: "#FFFFFF",
  backgroundColor: "#000000",
  backgroundOpacity: 0.8,
  fontSize: 14,
  fontFamily: "sans-serif",
  fontWeight: "bold",
  position: "top" as LabelPosition,
  padding: 8,
  borderRadius: 4,
  offset: 10,
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
  const borderColor = resolveColor(opts.borderColor);

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

  // Create SVG overlay with colored rectangle
  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        fill="none"
        stroke="${borderColor}"
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
  const borderColor = resolveColor(opts.borderColor);

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
        stroke="${borderColor}"
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

/**
 * Calculate arrow start point based on direction and target box
 */
function calculateArrowStart(
  box: BoundingBox,
  direction: ArrowDirection,
  length: number
): Point {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  switch (direction) {
    case "top":
      return { x: centerX, y: box.y - length };
    case "bottom":
      return { x: centerX, y: box.y + box.height + length };
    case "left":
      return { x: box.x - length, y: centerY };
    case "right":
      return { x: box.x + box.width + length, y: centerY };
    case "top-left":
      return { x: box.x - length * 0.7, y: box.y - length * 0.7 };
    case "top-right":
      return { x: box.x + box.width + length * 0.7, y: box.y - length * 0.7 };
    case "bottom-left":
      return { x: box.x - length * 0.7, y: box.y + box.height + length * 0.7 };
    case "bottom-right":
      return {
        x: box.x + box.width + length * 0.7,
        y: box.y + box.height + length * 0.7,
      };
    default:
      return { x: centerX, y: box.y - length };
  }
}

/**
 * Calculate arrow end point (where arrow points to) based on direction and target box
 */
function calculateArrowEnd(box: BoundingBox, direction: ArrowDirection): Point {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  switch (direction) {
    case "top":
      return { x: centerX, y: box.y };
    case "bottom":
      return { x: centerX, y: box.y + box.height };
    case "left":
      return { x: box.x, y: centerY };
    case "right":
      return { x: box.x + box.width, y: centerY };
    case "top-left":
      return { x: box.x, y: box.y };
    case "top-right":
      return { x: box.x + box.width, y: box.y };
    case "bottom-left":
      return { x: box.x, y: box.y + box.height };
    case "bottom-right":
      return { x: box.x + box.width, y: box.y + box.height };
    default:
      return { x: centerX, y: box.y };
  }
}

/**
 * Generate SVG arrow path with arrowhead
 */
function generateArrowSvg(
  from: Point,
  to: Point,
  color: string,
  strokeWidth: number,
  headSize: number
): string {
  // Calculate angle of the line
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  // Calculate arrowhead points
  const headAngle = Math.PI / 6; // 30 degrees
  const head1X = to.x - headSize * Math.cos(angle - headAngle);
  const head1Y = to.y - headSize * Math.sin(angle - headAngle);
  const head2X = to.x - headSize * Math.cos(angle + headAngle);
  const head2Y = to.y - headSize * Math.sin(angle + headAngle);

  return `
    <line
      x1="${from.x}"
      y1="${from.y}"
      x2="${to.x}"
      y2="${to.y}"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
    />
    <polygon
      points="${to.x},${to.y} ${head1X},${head1Y} ${head2X},${head2Y}"
      fill="${color}"
    />
  `;
}

/**
 * Add arrow annotation pointing to a bounding box
 */
export async function addArrow(
  imagePath: string,
  box: BoundingBox,
  options: ArrowOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_ARROW, ...options };
  const color = resolveColor(opts.color);

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  // Calculate start and end points
  const from =
    opts.from && opts.from.x !== 0 && opts.from.y !== 0
      ? opts.from
      : calculateArrowStart(box, opts.direction, opts.length);
  const to = calculateArrowEnd(box, opts.direction);

  const arrowSvg = generateArrowSvg(
    from,
    to,
    color,
    opts.strokeWidth,
    opts.headSize
  );

  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      ${arrowSvg}
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
 * Add arrow annotation from buffer
 */
export async function addArrowToBuffer(
  imageBuffer: Buffer,
  box: BoundingBox,
  options: ArrowOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_ARROW, ...options };
  const color = resolveColor(opts.color);

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const from =
    opts.from && opts.from.x !== 0 && opts.from.y !== 0
      ? opts.from
      : calculateArrowStart(box, opts.direction, opts.length);
  const to = calculateArrowEnd(box, opts.direction);

  const arrowSvg = generateArrowSvg(
    from,
    to,
    color,
    opts.strokeWidth,
    opts.headSize
  );

  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      ${arrowSvg}
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
 * Calculate label position based on target box and position option
 */
function calculateLabelPosition(
  box: BoundingBox,
  position: LabelPosition,
  labelWidth: number,
  labelHeight: number,
  offset: number,
  imageWidth: number,
  imageHeight: number
): Point {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  let x: number;
  let y: number;

  switch (position) {
    case "top":
      x = centerX - labelWidth / 2;
      y = box.y - labelHeight - offset;
      break;
    case "bottom":
      x = centerX - labelWidth / 2;
      y = box.y + box.height + offset;
      break;
    case "left":
      x = box.x - labelWidth - offset;
      y = centerY - labelHeight / 2;
      break;
    case "right":
      x = box.x + box.width + offset;
      y = centerY - labelHeight / 2;
      break;
    case "top-left":
      x = box.x - labelWidth - offset;
      y = box.y - labelHeight - offset;
      break;
    case "top-right":
      x = box.x + box.width + offset;
      y = box.y - labelHeight - offset;
      break;
    case "bottom-left":
      x = box.x - labelWidth - offset;
      y = box.y + box.height + offset;
      break;
    case "bottom-right":
      x = box.x + box.width + offset;
      y = box.y + box.height + offset;
      break;
    case "center":
      x = centerX - labelWidth / 2;
      y = centerY - labelHeight / 2;
      break;
    default:
      x = centerX - labelWidth / 2;
      y = box.y - labelHeight - offset;
  }

  // Clamp to image bounds
  x = Math.max(5, Math.min(imageWidth - labelWidth - 5, x));
  y = Math.max(5, Math.min(imageHeight - labelHeight - 5, y));

  return { x, y };
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }
  return hex;
}

/**
 * Add text label annotation near a bounding box
 */
export async function addTextLabel(
  imagePath: string,
  box: BoundingBox,
  text: string,
  options: TextLabelOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_TEXT_LABEL, ...options };
  const textColor = resolveColor(opts.textColor);
  const bgColor = resolveColor(opts.backgroundColor);
  const bgColorWithOpacity = hexToRgba(bgColor, opts.backgroundOpacity);

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  // Estimate label dimensions (approximate)
  const escapedText = escapeXml(text);
  const charWidth = opts.fontSize * 0.6;
  const labelWidth = text.length * charWidth + opts.padding * 2;
  const labelHeight = opts.fontSize + opts.padding * 2;

  const pos = calculateLabelPosition(
    box,
    opts.position,
    labelWidth,
    labelHeight,
    opts.offset,
    metadata.width,
    metadata.height
  );

  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <rect
        x="${pos.x}"
        y="${pos.y}"
        width="${labelWidth}"
        height="${labelHeight}"
        fill="${bgColorWithOpacity}"
        rx="${opts.borderRadius}"
        ry="${opts.borderRadius}"
      />
      <text
        x="${pos.x + opts.padding}"
        y="${pos.y + opts.padding + opts.fontSize * 0.8}"
        fill="${textColor}"
        font-family="${opts.fontFamily}"
        font-size="${opts.fontSize}"
        font-weight="${opts.fontWeight}"
      >${escapedText}</text>
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
 * Add text label annotation from buffer
 */
export async function addTextLabelToBuffer(
  imageBuffer: Buffer,
  box: BoundingBox,
  text: string,
  options: TextLabelOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_TEXT_LABEL, ...options };
  const textColor = resolveColor(opts.textColor);
  const bgColor = resolveColor(opts.backgroundColor);
  const bgColorWithOpacity = hexToRgba(bgColor, opts.backgroundOpacity);

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const escapedText = escapeXml(text);
  const charWidth = opts.fontSize * 0.6;
  const labelWidth = text.length * charWidth + opts.padding * 2;
  const labelHeight = opts.fontSize + opts.padding * 2;

  const pos = calculateLabelPosition(
    box,
    opts.position,
    labelWidth,
    labelHeight,
    opts.offset,
    metadata.width,
    metadata.height
  );

  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <rect
        x="${pos.x}"
        y="${pos.y}"
        width="${labelWidth}"
        height="${labelHeight}"
        fill="${bgColorWithOpacity}"
        rx="${opts.borderRadius}"
        ry="${opts.borderRadius}"
      />
      <text
        x="${pos.x + opts.padding}"
        y="${pos.y + opts.padding + opts.fontSize * 0.8}"
        fill="${textColor}"
        font-family="${opts.fontFamily}"
        font-size="${opts.fontSize}"
        font-weight="${opts.fontWeight}"
      >${escapedText}</text>
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
 * Add multiple annotations to an image at once
 * Applies in order: highlight -> arrow -> text label
 */
export async function addAnnotations(
  imagePath: string,
  box: BoundingBox,
  options: MultiAnnotationOptions
): Promise<Buffer> {
  let result = await sharp(imagePath).toBuffer();

  // Apply highlight if specified
  if (options.highlight) {
    result = await addHighlightToBuffer(result, box, options.highlight);
  }

  // Apply arrow if specified
  if (options.arrow) {
    result = await addArrowToBuffer(result, box, options.arrow);
  }

  // Apply text label if specified
  if (options.label) {
    result = await addTextLabelToBuffer(
      result,
      box,
      options.label.text,
      options.label.options
    );
  }

  return result;
}

/**
 * Add multiple annotations from buffer
 */
export async function addAnnotationsToBuffer(
  imageBuffer: Buffer,
  box: BoundingBox,
  options: MultiAnnotationOptions
): Promise<Buffer> {
  let result = imageBuffer;

  if (options.highlight) {
    result = await addHighlightToBuffer(result, box, options.highlight);
  }

  if (options.arrow) {
    result = await addArrowToBuffer(result, box, options.arrow);
  }

  if (options.label) {
    result = await addTextLabelToBuffer(
      result,
      box,
      options.label.text,
      options.label.options
    );
  }

  return result;
}
