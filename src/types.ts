/**
 * Types for browser-viz-skill
 */

/** Screencast frame from agent-browser */
export interface ScreencastFrame {
  data: string; // base64 encoded image
  metadata: {
    offsetTop: number;
    pageScaleFactor: number;
    deviceWidth: number;
    deviceHeight: number;
    scrollOffsetX: number;
    scrollOffsetY: number;
    timestamp?: number;
  };
  sessionId: number;
}

/** Bounding box for element */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ref element from agent-browser snapshot */
export interface RefElement {
  ref: string; // e.g., "@e1", "@e2"
  role: string;
  name?: string;
  box?: BoundingBox;
}

/** Predefined color names */
export type ColorName =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "cyan"
  | "magenta"
  | "white"
  | "black";

/** Color presets mapping */
export const COLOR_PRESETS: Record<ColorName, string> = {
  red: "#FF0000",
  blue: "#0066FF",
  green: "#00CC00",
  yellow: "#FFCC00",
  orange: "#FF6600",
  purple: "#9933FF",
  cyan: "#00CCCC",
  magenta: "#FF00FF",
  white: "#FFFFFF",
  black: "#000000",
};

/** Annotation options */
export interface AnnotationOptions {
  /** Highlight border color (default: red) - accepts hex color or ColorName */
  borderColor?: string | ColorName;
  /** Highlight border width (default: 3) */
  borderWidth?: number;
  /** Padding around highlight (default: 5) */
  padding?: number;
}

/** Point coordinates */
export interface Point {
  x: number;
  y: number;
}

/** Arrow direction */
export type ArrowDirection =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Arrow annotation options */
export interface ArrowOptions {
  /** Arrow color (default: red) - accepts hex color or ColorName */
  color?: string | ColorName;
  /** Arrow stroke width (default: 3) */
  strokeWidth?: number;
  /** Arrow head size (default: 12) */
  headSize?: number;
  /** Arrow length (default: 60) */
  length?: number;
  /** Direction from which arrow points to target */
  direction?: ArrowDirection;
  /** Custom start point (overrides direction) */
  from?: Point;
}

/** Text label position relative to target */
export type LabelPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

/** Text label options */
export interface TextLabelOptions {
  /** Text color (default: white) */
  textColor?: string | ColorName;
  /** Background color (default: black with opacity) */
  backgroundColor?: string | ColorName;
  /** Background opacity 0-1 (default: 0.8) */
  backgroundOpacity?: number;
  /** Font size in pixels (default: 14) */
  fontSize?: number;
  /** Font family (default: sans-serif) */
  fontFamily?: string;
  /** Font weight (default: bold) */
  fontWeight?: "normal" | "bold";
  /** Label position relative to target (default: top) */
  position?: LabelPosition;
  /** Padding inside label background (default: 8) */
  padding?: number;
  /** Border radius (default: 4) */
  borderRadius?: number;
  /** Offset from target element (default: 10) */
  offset?: number;
}

/** Combined annotation options for multiple annotations at once */
export interface MultiAnnotationOptions {
  /** Highlight options (if provided, adds highlight) */
  highlight?: AnnotationOptions;
  /** Arrow options (if provided, adds arrow) */
  arrow?: ArrowOptions;
  /** Text label and its options */
  label?: {
    text: string;
    options?: TextLabelOptions;
  };
}

/** Zoom options */
export interface ZoomOptions {
  /** Scale factor (default: 2) */
  scale?: number;
  /** Padding around zoomed area (default: 50) */
  padding?: number;
  /** Output width (optional, auto-calculated if not specified) */
  outputWidth?: number;
  /** Output height (optional, auto-calculated if not specified) */
  outputHeight?: number;
}

/** GIF recording options */
export interface GifRecordingOptions {
  /** Frame rate (default: 10) */
  frameRate?: number;
  /** Quality 1-30 (default: 10, lower is better) */
  quality?: number;
  /** Repeat (-1 = no repeat, 0 = infinite) */
  repeat?: number;
  /** Output width (optional, uses source width if not specified) */
  width?: number;
  /** Output height (optional, uses source height if not specified) */
  height?: number;
}

/** Recording state */
export interface RecordingState {
  isRecording: boolean;
  startTime?: number;
  frames: Buffer[];
  options: GifRecordingOptions;
}

/** agent-browser connection config */
export interface AgentBrowserConfig {
  /** WebSocket URL for screencast (default: ws://localhost:9223) */
  streamUrl?: string;
  /** Session name */
  session?: string;
}
