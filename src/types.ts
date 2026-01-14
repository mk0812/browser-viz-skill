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

/** Annotation options */
export interface AnnotationOptions {
  /** Highlight border color (default: red) */
  borderColor?: string;
  /** Highlight border width (default: 3) */
  borderWidth?: number;
  /** Padding around highlight (default: 5) */
  padding?: number;
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
