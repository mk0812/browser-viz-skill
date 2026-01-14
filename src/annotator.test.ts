/**
 * Tests for annotator module
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFile, writeFile, unlink } from "fs/promises";
import sharp from "sharp";
import {
  addHighlight,
  addHighlightToBuffer,
  zoomToArea,
  zoomToAreaFromBuffer,
  highlightAndZoom,
  saveImage,
  resolveColor,
  addArrow,
  addArrowToBuffer,
  addTextLabel,
  addTextLabelToBuffer,
  addAnnotations,
  addAnnotationsToBuffer,
} from "./annotator.js";
import type { BoundingBox, ArrowDirection, LabelPosition } from "./types.js";
import { COLOR_PRESETS } from "./types.js";

// Test image path
const TEST_IMAGE_PATH = "./test-fixtures/test-image.png";
const OUTPUT_DIR = "./test-output";

// Sample bounding box
const sampleBox: BoundingBox = {
  x: 100,
  y: 100,
  width: 200,
  height: 50,
};

describe("annotator", () => {
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    // Create test fixtures directory and a simple test image
    const { mkdir } = await import("fs/promises");
    await mkdir("./test-fixtures", { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Create a simple 800x600 test image
    testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    await writeFile(TEST_IMAGE_PATH, testImageBuffer);
  });

  describe("addHighlight", () => {
    it("should add red highlight to image file", async () => {
      const result = await addHighlight(TEST_IMAGE_PATH, sampleBox);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      // Verify it's a valid PNG
      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
    });

    it("should apply custom annotation options", async () => {
      const result = await addHighlight(TEST_IMAGE_PATH, sampleBox, {
        borderColor: "#00FF00",
        borderWidth: 5,
        padding: 10,
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle box at image edge", async () => {
      const edgeBox: BoundingBox = {
        x: 750,
        y: 550,
        width: 100,
        height: 100,
      };

      const result = await addHighlight(TEST_IMAGE_PATH, edgeBox);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("addHighlightToBuffer", () => {
    it("should add red highlight to image buffer", async () => {
      const result = await addHighlightToBuffer(testImageBuffer, sampleBox);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });
  });

  describe("zoomToArea", () => {
    it("should zoom to specified area from file", async () => {
      const result = await zoomToArea(TEST_IMAGE_PATH, sampleBox);

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
      // Default scale is 2, so output should be larger than crop area
      expect(metadata.width).toBeGreaterThan(sampleBox.width);
    });

    it("should apply custom zoom options", async () => {
      const result = await zoomToArea(TEST_IMAGE_PATH, sampleBox, {
        scale: 3,
        padding: 20,
      });

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      // With scale 3 and padding, output should be approximately 3x the padded size
      expect(metadata.width).toBeGreaterThan(sampleBox.width * 2);
    });

    it("should respect fixed output dimensions", async () => {
      const result = await zoomToArea(TEST_IMAGE_PATH, sampleBox, {
        outputWidth: 400,
        outputHeight: 300,
      });

      const metadata = await sharp(result).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(300);
    });
  });

  describe("zoomToAreaFromBuffer", () => {
    it("should zoom to specified area from buffer", async () => {
      const result = await zoomToAreaFromBuffer(testImageBuffer, sampleBox, {
        scale: 2,
      });

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });
  });

  describe("highlightAndZoom", () => {
    it("should combine highlight and zoom", async () => {
      const result = await highlightAndZoom(TEST_IMAGE_PATH, sampleBox);

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });

    it("should apply both annotation and zoom options", async () => {
      const result = await highlightAndZoom(
        TEST_IMAGE_PATH,
        sampleBox,
        { borderColor: "#0000FF", borderWidth: 4 },
        { scale: 1.5, padding: 30 }
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("saveImage", () => {
    it("should save buffer to file", async () => {
      const outputPath = `${OUTPUT_DIR}/save-test.png`;
      const highlighted = await addHighlight(TEST_IMAGE_PATH, sampleBox);

      await saveImage(highlighted, outputPath);

      const saved = await readFile(outputPath);
      expect(saved.length).toBeGreaterThan(0);

      const metadata = await sharp(saved).metadata();
      expect(metadata.format).toBe("png");

      // Cleanup
      await unlink(outputPath);
    });
  });

  describe("resolveColor", () => {
    it("should resolve named colors to hex codes", () => {
      expect(resolveColor("red")).toBe("#FF0000");
      expect(resolveColor("blue")).toBe("#0066FF");
      expect(resolveColor("green")).toBe("#00CC00");
      expect(resolveColor("yellow")).toBe("#FFCC00");
    });

    it("should pass through hex colors unchanged", () => {
      expect(resolveColor("#123456")).toBe("#123456");
      expect(resolveColor("#AABBCC")).toBe("#AABBCC");
    });
  });

  describe("addHighlight with named colors", () => {
    it("should accept named color for highlight", async () => {
      const result = await addHighlight(TEST_IMAGE_PATH, sampleBox, {
        borderColor: "blue",
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should accept all predefined colors", async () => {
      const colors = Object.keys(COLOR_PRESETS) as Array<keyof typeof COLOR_PRESETS>;

      for (const color of colors) {
        const result = await addHighlight(TEST_IMAGE_PATH, sampleBox, {
          borderColor: color,
        });
        expect(result).toBeInstanceOf(Buffer);
      }
    });
  });

  describe("addArrow", () => {
    it("should add arrow pointing to element from file", async () => {
      const result = await addArrow(TEST_IMAGE_PATH, sampleBox);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
    });

    it("should accept custom arrow options", async () => {
      const result = await addArrow(TEST_IMAGE_PATH, sampleBox, {
        color: "blue",
        strokeWidth: 5,
        headSize: 20,
        length: 80,
        direction: "right",
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should work with all arrow directions", async () => {
      const directions: ArrowDirection[] = [
        "top", "bottom", "left", "right",
        "top-left", "top-right", "bottom-left", "bottom-right"
      ];

      for (const direction of directions) {
        const result = await addArrow(TEST_IMAGE_PATH, sampleBox, { direction });
        expect(result).toBeInstanceOf(Buffer);
      }
    });

    it("should accept custom start point", async () => {
      const result = await addArrow(TEST_IMAGE_PATH, sampleBox, {
        from: { x: 50, y: 50 },
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("addArrowToBuffer", () => {
    it("should add arrow from buffer", async () => {
      const result = await addArrowToBuffer(testImageBuffer, sampleBox, {
        color: "green",
        direction: "bottom",
      });

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });
  });

  describe("addTextLabel", () => {
    it("should add text label near element", async () => {
      const result = await addTextLabel(
        TEST_IMAGE_PATH,
        sampleBox,
        "Click here"
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });

    it("should accept custom text label options", async () => {
      const result = await addTextLabel(TEST_IMAGE_PATH, sampleBox, "Step 1", {
        textColor: "black",
        backgroundColor: "yellow",
        backgroundOpacity: 0.9,
        fontSize: 18,
        fontWeight: "bold",
        position: "bottom",
        padding: 12,
        borderRadius: 8,
        offset: 15,
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should work with all label positions", async () => {
      const positions: LabelPosition[] = [
        "top", "bottom", "left", "right",
        "top-left", "top-right", "bottom-left", "bottom-right", "center"
      ];

      for (const position of positions) {
        const result = await addTextLabel(TEST_IMAGE_PATH, sampleBox, "Test", {
          position,
        });
        expect(result).toBeInstanceOf(Buffer);
      }
    });

    it("should escape special XML characters", async () => {
      const result = await addTextLabel(
        TEST_IMAGE_PATH,
        sampleBox,
        "<Click & Test>"
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("addTextLabelToBuffer", () => {
    it("should add text label from buffer", async () => {
      const result = await addTextLabelToBuffer(
        testImageBuffer,
        sampleBox,
        "Label Text",
        { position: "right", textColor: "white", backgroundColor: "purple" }
      );

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });
  });

  describe("addAnnotations", () => {
    it("should add multiple annotations at once", async () => {
      const result = await addAnnotations(TEST_IMAGE_PATH, sampleBox, {
        highlight: { borderColor: "red", borderWidth: 3 },
        arrow: { color: "blue", direction: "top" },
        label: { text: "Important", options: { position: "bottom" } },
      });

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });

    it("should work with highlight only", async () => {
      const result = await addAnnotations(TEST_IMAGE_PATH, sampleBox, {
        highlight: { borderColor: "green" },
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should work with arrow only", async () => {
      const result = await addAnnotations(TEST_IMAGE_PATH, sampleBox, {
        arrow: { color: "orange", direction: "left" },
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should work with label only", async () => {
      const result = await addAnnotations(TEST_IMAGE_PATH, sampleBox, {
        label: { text: "Click me" },
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("addAnnotationsToBuffer", () => {
    it("should add multiple annotations from buffer", async () => {
      const result = await addAnnotationsToBuffer(testImageBuffer, sampleBox, {
        highlight: { borderColor: "cyan" },
        arrow: { color: "magenta", direction: "right" },
        label: { text: "Test Label", options: { textColor: "white" } },
      });

      expect(result).toBeInstanceOf(Buffer);

      const metadata = await sharp(result).metadata();
      expect(metadata.format).toBe("png");
    });
  });
});
