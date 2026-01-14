/**
 * browser-viz-skill
 * Browser visualization tool for agent-browser
 * GIF recording and snapshot annotation
 */

// Re-export all types
export type {
  ScreencastFrame,
  BoundingBox,
  RefElement,
  AnnotationOptions,
  ZoomOptions,
  GifRecordingOptions,
  RecordingState,
  AgentBrowserConfig,
  // New annotation types
  ColorName,
  Point,
  ArrowDirection,
  ArrowOptions,
  LabelPosition,
  TextLabelOptions,
  MultiAnnotationOptions,
} from "./types.js";

// Re-export color presets
export { COLOR_PRESETS } from "./types.js";

// Re-export annotator functions
export {
  // Existing functions
  addHighlight,
  addHighlightToBuffer,
  zoomToArea,
  zoomToAreaFromBuffer,
  highlightAndZoom,
  saveImage,
  // New functions
  resolveColor,
  addArrow,
  addArrowToBuffer,
  addTextLabel,
  addTextLabelToBuffer,
  addAnnotations,
  addAnnotationsToBuffer,
} from "./annotator.js";

// Re-export GIF recorder
export { GifRecorder, recordWithScreenshots } from "./gif-recorder.js";

// Re-export focus detector
export {
  parseSnapshot,
  getRefBoundingBox,
  getSnapshot,
  getScreenshot,
  calculateOptimalZoomRegion,
  suggestFocusElement,
  getAllRefBoxes,
} from "./focus-detector.js";
