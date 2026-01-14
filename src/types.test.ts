/**
 * Tests for types module
 * Primarily validates type definitions compile correctly
 */
import { describe, it, expect } from "vitest";
import type {
  ScreencastFrame,
  BoundingBox,
  RefElement,
  AnnotationOptions,
  ZoomOptions,
  GifRecordingOptions,
  RecordingState,
  AgentBrowserConfig,
} from "./types.js";

describe("types", () => {
  describe("BoundingBox", () => {
    it("should accept valid bounding box", () => {
      const box: BoundingBox = {
        x: 100,
        y: 200,
        width: 300,
        height: 150,
      };

      expect(box.x).toBe(100);
      expect(box.y).toBe(200);
      expect(box.width).toBe(300);
      expect(box.height).toBe(150);
    });
  });

  describe("RefElement", () => {
    it("should accept valid ref element with all fields", () => {
      const element: RefElement = {
        ref: "@e5",
        role: "button",
        name: "Submit",
        box: { x: 0, y: 0, width: 100, height: 50 },
      };

      expect(element.ref).toBe("@e5");
      expect(element.role).toBe("button");
      expect(element.name).toBe("Submit");
      expect(element.box).toBeDefined();
    });

    it("should accept ref element without optional fields", () => {
      const element: RefElement = {
        ref: "@e1",
        role: "generic",
      };

      expect(element.ref).toBe("@e1");
      expect(element.name).toBeUndefined();
      expect(element.box).toBeUndefined();
    });
  });

  describe("AnnotationOptions", () => {
    it("should accept partial options", () => {
      const options: AnnotationOptions = {
        borderColor: "#00FF00",
      };

      expect(options.borderColor).toBe("#00FF00");
      expect(options.borderWidth).toBeUndefined();
    });

    it("should accept full options", () => {
      const options: AnnotationOptions = {
        borderColor: "#FF0000",
        borderWidth: 5,
        padding: 10,
      };

      expect(options.borderColor).toBe("#FF0000");
      expect(options.borderWidth).toBe(5);
      expect(options.padding).toBe(10);
    });
  });

  describe("ZoomOptions", () => {
    it("should accept partial options", () => {
      const options: ZoomOptions = {
        scale: 2.5,
      };

      expect(options.scale).toBe(2.5);
    });

    it("should accept output dimensions", () => {
      const options: ZoomOptions = {
        outputWidth: 800,
        outputHeight: 600,
      };

      expect(options.outputWidth).toBe(800);
      expect(options.outputHeight).toBe(600);
    });
  });

  describe("GifRecordingOptions", () => {
    it("should accept valid recording options", () => {
      const options: GifRecordingOptions = {
        frameRate: 15,
        quality: 5,
        repeat: 0,
        width: 1280,
        height: 720,
      };

      expect(options.frameRate).toBe(15);
      expect(options.quality).toBe(5);
      expect(options.repeat).toBe(0);
    });
  });

  describe("RecordingState", () => {
    it("should accept valid recording state", () => {
      const state: RecordingState = {
        isRecording: true,
        startTime: Date.now(),
        frames: [],
        options: { frameRate: 10 },
      };

      expect(state.isRecording).toBe(true);
      expect(state.frames).toHaveLength(0);
    });
  });

  describe("AgentBrowserConfig", () => {
    it("should accept valid config", () => {
      const config: AgentBrowserConfig = {
        streamUrl: "ws://localhost:9223",
        session: "test-session",
      };

      expect(config.streamUrl).toBe("ws://localhost:9223");
      expect(config.session).toBe("test-session");
    });

    it("should accept empty config", () => {
      const config: AgentBrowserConfig = {};

      expect(config.streamUrl).toBeUndefined();
      expect(config.session).toBeUndefined();
    });
  });

  describe("ScreencastFrame", () => {
    it("should accept valid screencast frame", () => {
      const frame: ScreencastFrame = {
        data: "base64encodeddata",
        metadata: {
          offsetTop: 0,
          pageScaleFactor: 1,
          deviceWidth: 1280,
          deviceHeight: 720,
          scrollOffsetX: 0,
          scrollOffsetY: 0,
          timestamp: Date.now(),
        },
        sessionId: 1,
      };

      expect(frame.data).toBe("base64encodeddata");
      expect(frame.metadata.deviceWidth).toBe(1280);
      expect(frame.sessionId).toBe(1);
    });
  });
});
