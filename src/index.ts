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
} from "./types.js";

// Re-export annotator functions
export {
  addHighlight,
  addHighlightToBuffer,
  zoomToArea,
  zoomToAreaFromBuffer,
  highlightAndZoom,
  saveImage,
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
