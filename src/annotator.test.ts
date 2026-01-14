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
} from "./annotator.js";
import type { BoundingBox } from "./types.js";

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
});
