/**
 * Focus Detector - Detect and parse ref elements from agent-browser snapshots
 * Enables AI to automatically focus on relevant elements
 */

import { spawn } from "child_process";
import type { BoundingBox, RefElement } from "./types.js";

/**
 * Parse agent-browser snapshot output to extract ref elements
 */
export function parseSnapshot(snapshotOutput: string): RefElement[] {
  const elements: RefElement[] = [];
  const lines = snapshotOutput.split("\n");

  // Regex to match ref patterns like [ref=e1], [ref=e2]
  const refRegex = /\[ref=([^\]]+)\]/;
  const roleRegex = /^[\s-]*(\w+)\s+"([^"]*)"/;

  for (const line of lines) {
    const refMatch = line.match(refRegex);
    if (refMatch) {
      const ref = `@${refMatch[1]}`;
      const roleMatch = line.match(roleRegex);

      elements.push({
        ref,
        role: roleMatch ? roleMatch[1] : "unknown",
        name: roleMatch ? roleMatch[2] : undefined,
      });
    }
  }

  return elements;
}

/**
 * Get bounding box for a ref element via agent-browser
 */
export async function getRefBoundingBox(
  ref: string,
  session: string = "default"
): Promise<BoundingBox> {
  return new Promise((resolve, reject) => {
    // Use agent-browser get box command
    const proc = spawn("agent-browser", [
      "get", "box", ref,
      "-s", session,
      "--json",
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          // agent-browser returns box as { x, y, width, height }
          if (result.data && result.data.box) {
            resolve(result.data.box);
          } else if (result.x !== undefined) {
            resolve(result);
          } else {
            reject(new Error("Could not parse bounding box from response"));
          }
        } catch {
          reject(new Error(`Failed to parse JSON: ${stdout}`));
        }
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Get current snapshot from agent-browser
 */
export async function getSnapshot(
  session: string = "default",
  interactive: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ["snapshot", "-s", session];
    if (interactive) {
      args.push("-i");
    }

    const proc = spawn("agent-browser", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Get screenshot from agent-browser
 */
export async function getScreenshot(
  session: string = "default",
  outputPath?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const args = ["screenshot", "-s", session];

    if (outputPath) {
      args.push("-o", outputPath);
    } else {
      args.push("--base64");
    }

    const proc = spawn("agent-browser", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        if (outputPath) {
          // Read the file
          import("fs/promises").then(({ readFile }) => {
            readFile(outputPath).then(resolve).catch(reject);
          });
        } else {
          resolve(Buffer.from(stdout.trim(), "base64"));
        }
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });
  });
}

/**
 * Find optimal zoom region for a ref element
 * Includes surrounding context for better visualization
 */
export function calculateOptimalZoomRegion(
  box: BoundingBox,
  imageWidth: number,
  imageHeight: number,
  contextPadding: number = 100
): BoundingBox {
  // Add context around the element
  const x = Math.max(0, box.x - contextPadding);
  const y = Math.max(0, box.y - contextPadding);

  // Ensure we don't exceed image bounds
  const width = Math.min(
    imageWidth - x,
    box.width + contextPadding * 2
  );
  const height = Math.min(
    imageHeight - y,
    box.height + contextPadding * 2
  );

  // Ensure minimum size for readability
  const minSize = 200;
  const adjustedWidth = Math.max(width, minSize);
  const adjustedHeight = Math.max(height, minSize);

  return {
    x,
    y,
    width: Math.min(adjustedWidth, imageWidth - x),
    height: Math.min(adjustedHeight, imageHeight - y),
  };
}

/**
 * Detect which element was likely interacted with based on recent action
 * This is a heuristic based on common interaction patterns
 */
export function suggestFocusElement(
  snapshot: string,
  lastAction?: string
): RefElement | null {
  const elements = parseSnapshot(snapshot);

  if (!lastAction || elements.length === 0) {
    // Return first interactive element if no action specified
    return elements[0] || null;
  }

  // Parse the ref from the action if present
  const refMatch = lastAction.match(/@e\d+/);
  if (refMatch) {
    const targetRef = refMatch[0];
    return elements.find((e) => e.ref === targetRef) || elements[0];
  }

  // Heuristic: prioritize buttons, inputs, links
  const priorityRoles = ["button", "textbox", "link", "checkbox", "combobox"];
  for (const role of priorityRoles) {
    const found = elements.find((e) => e.role === role);
    if (found) return found;
  }

  return elements[0];
}

/**
 * Get all ref elements with their bounding boxes
 */
export async function getAllRefBoxes(
  session: string = "default"
): Promise<Map<string, BoundingBox>> {
  const snapshot = await getSnapshot(session, true);
  const elements = parseSnapshot(snapshot);
  const boxes = new Map<string, BoundingBox>();

  for (const element of elements) {
    try {
      const box = await getRefBoundingBox(element.ref, session);
      boxes.set(element.ref, box);
    } catch {
      // Element might not have a bounding box, skip
    }
  }

  return boxes;
}
