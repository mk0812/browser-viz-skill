#!/usr/bin/env node
/**
 * browser-viz CLI
 * Browser visualization tool for agent-browser
 */

import { program } from "commander";
import { writeFile } from "fs/promises";
import {
  addHighlight,
  zoomToArea,
  highlightAndZoom,
  saveImage,
  GifRecorder,
  recordWithScreenshots,
  getRefBoundingBox,
  getSnapshot,
  getScreenshot,
  parseSnapshot,
  suggestFocusElement,
  calculateOptimalZoomRegion,
} from "../dist/index.js";
import sharp from "sharp";

program
  .name("browser-viz")
  .description("Browser visualization tool for agent-browser")
  .version("0.1.0");

// =============================================================================
// Annotate command
// =============================================================================
program
  .command("annotate")
  .description("Add annotations to a screenshot")
  .argument("<image>", "Input image path")
  .option("-o, --output <path>", "Output path", "annotated.png")
  .option("-s, --session <name>", "agent-browser session", "default")
  .option("--highlight <ref>", "Highlight element by ref (e.g., @e5)")
  .option("--highlight-box <box>", "Highlight by box (x,y,width,height)")
  .option("--zoom <ref>", "Zoom to element by ref")
  .option("--zoom-box <box>", "Zoom to box (x,y,width,height)")
  .option("--scale <number>", "Zoom scale factor", "2")
  .option("--color <color>", "Highlight border color", "#FF0000")
  .option("--border-width <number>", "Highlight border width", "3")
  .option("--padding <number>", "Padding around element", "10")
  .action(async (imagePath, options) => {
    try {
      let box = null;

      // Get bounding box from ref or direct box specification
      if (options.highlight || options.zoom) {
        const ref = options.highlight || options.zoom;
        box = await getRefBoundingBox(ref, options.session);
      } else if (options.highlightBox || options.zoomBox) {
        const boxStr = options.highlightBox || options.zoomBox;
        const [x, y, width, height] = boxStr.split(",").map(Number);
        box = { x, y, width, height };
      }

      if (!box) {
        console.error("Error: Must specify --highlight, --zoom, --highlight-box, or --zoom-box");
        process.exit(1);
      }

      const annotationOpts = {
        borderColor: options.color,
        borderWidth: parseInt(options.borderWidth),
        padding: parseInt(options.padding),
      };

      const zoomOpts = {
        scale: parseFloat(options.scale),
        padding: parseInt(options.padding),
      };

      let result;
      if (options.highlight && options.zoom) {
        // Both highlight and zoom
        result = await highlightAndZoom(imagePath, box, annotationOpts, zoomOpts);
      } else if (options.highlight || options.highlightBox) {
        // Just highlight
        result = await addHighlight(imagePath, box, annotationOpts);
      } else {
        // Just zoom
        result = await zoomToArea(imagePath, box, zoomOpts);
      }

      await saveImage(result, options.output);
      console.log(`Saved to: ${options.output}`);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// =============================================================================
// Capture command - screenshot with optional annotation
// =============================================================================
program
  .command("capture")
  .description("Take screenshot and optionally annotate")
  .option("-o, --output <path>", "Output path", "capture.png")
  .option("-s, --session <name>", "agent-browser session", "default")
  .option("--highlight <ref>", "Highlight element by ref")
  .option("--zoom <ref>", "Zoom to element by ref")
  .option("--scale <number>", "Zoom scale factor", "2")
  .option("--auto-focus", "Auto-detect and focus on last interacted element")
  .action(async (options) => {
    try {
      // Take screenshot
      const screenshot = await getScreenshot(options.session);

      if (!options.highlight && !options.zoom && !options.autoFocus) {
        // Just save the screenshot
        await saveImage(screenshot, options.output);
        console.log(`Screenshot saved to: ${options.output}`);
        return;
      }

      let ref = options.highlight || options.zoom;

      // Auto-focus mode
      if (options.autoFocus && !ref) {
        const snapshot = await getSnapshot(options.session);
        const suggested = suggestFocusElement(snapshot);
        if (suggested) {
          ref = suggested.ref;
          console.log(`Auto-focused on: ${ref} (${suggested.role}: ${suggested.name || ""})`);
        }
      }

      if (!ref) {
        await saveImage(screenshot, options.output);
        console.log(`Screenshot saved to: ${options.output}`);
        return;
      }

      // Get bounding box
      const box = await getRefBoundingBox(ref, options.session);
      const metadata = await sharp(screenshot).metadata();

      // Calculate optimal zoom region if zooming
      const zoomRegion = options.zoom
        ? calculateOptimalZoomRegion(box, metadata.width || 800, metadata.height || 600)
        : box;

      // Apply annotations
      let result = screenshot;
      const { addHighlightToBuffer, zoomToAreaFromBuffer } = await import("../dist/annotator.js");

      if (options.highlight) {
        result = await addHighlightToBuffer(result, box);
      }

      if (options.zoom) {
        result = await zoomToAreaFromBuffer(result, zoomRegion, {
          scale: parseFloat(options.scale),
        });
      }

      await saveImage(result, options.output);
      console.log(`Annotated screenshot saved to: ${options.output}`);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// =============================================================================
// Record command
// =============================================================================
const recordCmd = program
  .command("record")
  .description("Record browser session as GIF");

recordCmd
  .command("start")
  .description("Start recording (uses screenshot method)")
  .option("-s, --session <name>", "agent-browser session", "default")
  .option("-d, --duration <ms>", "Recording duration in milliseconds", "5000")
  .option("-o, --output <path>", "Output GIF path", "recording.gif")
  .option("--fps <number>", "Frame rate", "5")
  .action(async (options) => {
    try {
      await recordWithScreenshots(
        parseInt(options.duration),
        options.output,
        {
          frameRate: parseInt(options.fps),
        },
        options.session
      );
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// =============================================================================
// Refs command - list ref elements from snapshot
// =============================================================================
program
  .command("refs")
  .description("List ref elements from current page snapshot")
  .option("-s, --session <name>", "agent-browser session", "default")
  .action(async (options) => {
    try {
      const snapshot = await getSnapshot(options.session);
      const elements = parseSnapshot(snapshot);

      if (elements.length === 0) {
        console.log("No interactive elements found");
        return;
      }

      console.log("Interactive elements:");
      for (const el of elements) {
        console.log(`  ${el.ref} - ${el.role}${el.name ? `: "${el.name}"` : ""}`);
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

// =============================================================================
// Box command - get element bounding box
// =============================================================================
program
  .command("box")
  .description("Get bounding box for a ref element")
  .argument("<ref>", "Element ref (e.g., @e5)")
  .option("-s, --session <name>", "agent-browser session", "default")
  .option("--json", "Output as JSON")
  .action(async (ref, options) => {
    try {
      const box = await getRefBoundingBox(ref, options.session);

      if (options.json) {
        console.log(JSON.stringify(box, null, 2));
      } else {
        console.log(`${ref}: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

program.parse();
