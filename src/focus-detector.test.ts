/**
 * Tests for focus-detector module
 */
import { describe, it, expect } from "vitest";
import {
  parseSnapshot,
  calculateOptimalZoomRegion,
  suggestFocusElement,
} from "./focus-detector.js";
import type { BoundingBox, RefElement } from "./types.js";

describe("focus-detector", () => {
  describe("parseSnapshot", () => {
    it("should parse snapshot output with ref elements", () => {
      const snapshotOutput = `
- textbox "検索..." [ref=e1]
- button "すべて" [ref=e2]
- button "未完了" [ref=e3]
- button "完了" [ref=e4]
- textbox "新しいタスクを追加..." [ref=e5]
- textbox "説明（任意）" [ref=e6]
- button "追加" [ref=e7]
      `;

      const elements = parseSnapshot(snapshotOutput);

      expect(elements).toHaveLength(7);
      expect(elements[0]).toEqual({
        ref: "@e1",
        role: "textbox",
        name: "検索...",
      });
      expect(elements[4]).toEqual({
        ref: "@e5",
        role: "textbox",
        name: "新しいタスクを追加...",
      });
      expect(elements[6]).toEqual({
        ref: "@e7",
        role: "button",
        name: "追加",
      });
    });

    it("should handle empty snapshot", () => {
      const elements = parseSnapshot("");
      expect(elements).toHaveLength(0);
    });

    it("should handle snapshot without refs", () => {
      const snapshotOutput = `
- heading "Page Title"
- paragraph "Some text content"
      `;

      const elements = parseSnapshot(snapshotOutput);
      expect(elements).toHaveLength(0);
    });

    it("should parse elements without names", () => {
      const snapshotOutput = `
- generic [ref=e1]
- group [ref=e2]
      `;

      const elements = parseSnapshot(snapshotOutput);
      expect(elements).toHaveLength(2);
      expect(elements[0].ref).toBe("@e1");
      expect(elements[0].name).toBeUndefined();
    });
  });

  describe("calculateOptimalZoomRegion", () => {
    const imageWidth = 1280;
    const imageHeight = 720;

    it("should add context padding around element", () => {
      const box: BoundingBox = {
        x: 500,
        y: 300,
        width: 100,
        height: 50,
      };

      const region = calculateOptimalZoomRegion(box, imageWidth, imageHeight);

      // Should have padding on all sides
      expect(region.x).toBeLessThan(box.x);
      expect(region.y).toBeLessThan(box.y);
      expect(region.width).toBeGreaterThan(box.width);
      expect(region.height).toBeGreaterThan(box.height);
    });

    it("should not exceed image bounds", () => {
      const box: BoundingBox = {
        x: 1200,
        y: 650,
        width: 100,
        height: 100,
      };

      const region = calculateOptimalZoomRegion(box, imageWidth, imageHeight);

      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.width).toBeLessThanOrEqual(imageWidth);
      expect(region.y + region.height).toBeLessThanOrEqual(imageHeight);
    });

    it("should handle element at origin", () => {
      const box: BoundingBox = {
        x: 0,
        y: 0,
        width: 50,
        height: 30,
      };

      const region = calculateOptimalZoomRegion(box, imageWidth, imageHeight);

      expect(region.x).toBe(0);
      expect(region.y).toBe(0);
      expect(region.width).toBeGreaterThanOrEqual(200); // min size
      expect(region.height).toBeGreaterThanOrEqual(200); // min size
    });

    it("should respect custom context padding", () => {
      const box: BoundingBox = {
        x: 500,
        y: 300,
        width: 100,
        height: 50,
      };

      const regionDefault = calculateOptimalZoomRegion(box, imageWidth, imageHeight, 100);
      const regionLarge = calculateOptimalZoomRegion(box, imageWidth, imageHeight, 200);

      expect(regionLarge.width).toBeGreaterThan(regionDefault.width);
      expect(regionLarge.height).toBeGreaterThan(regionDefault.height);
    });

    it("should ensure minimum size for readability", () => {
      const smallBox: BoundingBox = {
        x: 500,
        y: 300,
        width: 10,
        height: 10,
      };

      const region = calculateOptimalZoomRegion(smallBox, imageWidth, imageHeight, 50);

      // Should be at least 200x200 for readability
      expect(region.width).toBeGreaterThanOrEqual(200);
      expect(region.height).toBeGreaterThanOrEqual(200);
    });
  });

  describe("suggestFocusElement", () => {
    const sampleSnapshot = `
- textbox "検索..." [ref=e1]
- button "すべて" [ref=e2]
- link "ホーム" [ref=e3]
- checkbox "完了" [ref=e4]
- textbox "新しいタスク" [ref=e5]
    `;

    it("should return first element when no action specified", () => {
      const suggested = suggestFocusElement(sampleSnapshot);

      expect(suggested).not.toBeNull();
      expect(suggested?.ref).toBe("@e1");
    });

    it("should find element from action with ref", () => {
      const suggested = suggestFocusElement(sampleSnapshot, "click @e3");

      expect(suggested).not.toBeNull();
      expect(suggested?.ref).toBe("@e3");
    });

    it("should prioritize interactive elements when action has no ref", () => {
      const suggested = suggestFocusElement(sampleSnapshot, "some action");

      expect(suggested).not.toBeNull();
      // Should return button as it's a priority role
      expect(suggested?.role).toBe("button");
    });

    it("should return null for empty snapshot", () => {
      const suggested = suggestFocusElement("");

      expect(suggested).toBeNull();
    });

    it("should handle action with non-existent ref", () => {
      const suggested = suggestFocusElement(sampleSnapshot, "click @e99");

      // Should fall back to first element
      expect(suggested).not.toBeNull();
      expect(suggested?.ref).toBe("@e1");
    });
  });
});
