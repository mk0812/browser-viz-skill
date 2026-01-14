/**
 * GIF Recorder - Record browser sessions as GIF via agent-browser screencast
 */

import WebSocket from "ws";
import sharp from "sharp";
import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import type {
  ScreencastFrame,
  GifRecordingOptions,
  RecordingState,
  AgentBrowserConfig,
} from "./types.js";

const DEFAULT_OPTIONS: Required<GifRecordingOptions> = {
  frameRate: 10,
  quality: 10,
  repeat: 0,
  width: 0,
  height: 0,
};

const DEFAULT_CONFIG: Required<AgentBrowserConfig> = {
  streamUrl: "ws://localhost:9223",
  session: "default",
};

/**
 * GIF Recorder class
 * Connects to agent-browser screencast and records frames
 */
export class GifRecorder {
  private ws: WebSocket | null = null;
  private state: RecordingState = {
    isRecording: false,
    frames: [],
    options: DEFAULT_OPTIONS,
  };
  private config: Required<AgentBrowserConfig>;
  private frameInterval: number;
  private lastFrameTime: number = 0;

  constructor(config: AgentBrowserConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameInterval = 1000 / DEFAULT_OPTIONS.frameRate;
  }

  /**
   * Connect to agent-browser screencast WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.streamUrl);

        this.ws.on("open", () => {
          console.log(`Connected to agent-browser screencast: ${this.config.streamUrl}`);
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          this.handleFrame(data);
        });

        this.ws.on("error", (error) => {
          console.error("WebSocket error:", error.message);
          reject(error);
        });

        this.ws.on("close", () => {
          console.log("WebSocket connection closed");
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming screencast frame
   */
  private async handleFrame(data: WebSocket.Data): Promise<void> {
    if (!this.state.isRecording) return;

    const now = Date.now();
    if (now - this.lastFrameTime < this.frameInterval) {
      return; // Skip frame to maintain target frame rate
    }
    this.lastFrameTime = now;

    try {
      const message = JSON.parse(data.toString());

      // Check if this is a screencast frame
      if (message.type === "frame" && message.data) {
        const frame: ScreencastFrame = message;
        const imageBuffer = Buffer.from(frame.data, "base64");

        // Resize if needed
        let processedBuffer: Buffer;
        if (this.state.options.width && this.state.options.height) {
          processedBuffer = Buffer.from(
            await sharp(imageBuffer)
              .resize(this.state.options.width, this.state.options.height)
              .png()
              .toBuffer()
          );
        } else {
          // Ensure PNG format
          processedBuffer = Buffer.from(await sharp(imageBuffer).png().toBuffer());
        }

        this.state.frames.push(processedBuffer);
      }
    } catch {
      // Not a JSON message or not a frame, ignore
    }
  }

  /**
   * Start recording
   */
  async startRecording(options: GifRecordingOptions = {}): Promise<void> {
    this.state.options = { ...DEFAULT_OPTIONS, ...options };
    this.frameInterval = 1000 / (this.state.options.frameRate || DEFAULT_OPTIONS.frameRate);
    this.state.frames = [];
    this.state.startTime = Date.now();
    this.state.isRecording = true;
    this.lastFrameTime = 0;

    // Start screencast via agent-browser CLI
    try {
      await this.sendCommand("screencast_start");
    } catch (error) {
      console.warn("Could not start screencast via command, relying on existing stream");
    }

    console.log("Recording started...");
  }

  /**
   * Stop recording and generate GIF
   */
  async stopRecording(outputPath: string): Promise<void> {
    this.state.isRecording = false;

    // Stop screencast
    try {
      await this.sendCommand("screencast_stop");
    } catch {
      // Ignore if command fails
    }

    if (this.state.frames.length === 0) {
      throw new Error("No frames recorded");
    }

    console.log(`Generating GIF from ${this.state.frames.length} frames...`);

    await this.generateGif(outputPath);
    console.log(`GIF saved to: ${outputPath}`);
  }

  /**
   * Generate GIF from recorded frames using ffmpeg
   */
  private async generateGif(outputPath: string): Promise<void> {
    const frames = this.state.frames;
    const options = this.state.options;

    // Get dimensions from first frame
    const firstFrameMeta = await sharp(frames[0]).metadata();
    const width = options.width || firstFrameMeta.width || 800;
    const height = options.height || firstFrameMeta.height || 600;

    // Use ffmpeg to create GIF
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y", // Overwrite output
        "-f", "image2pipe",
        "-framerate", String(options.frameRate),
        "-i", "-", // Read from stdin
        "-vf", `fps=${options.frameRate},scale=${width}:${height}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        "-loop", String(options.repeat),
        outputPath,
      ]);

      ffmpeg.on("error", (error) => {
        reject(new Error(`ffmpeg error: ${error.message}. Make sure ffmpeg is installed.`));
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      // Write frames to ffmpeg stdin
      (async () => {
        for (const frame of frames) {
          ffmpeg.stdin.write(frame);
        }
        ffmpeg.stdin.end();
      })();
    });
  }

  /**
   * Send command to agent-browser (via CLI)
   */
  private async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("agent-browser", [command, "-s", this.config.session]);
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
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return { ...this.state };
  }
}

/**
 * Simple recording function - captures screenshots at intervals
 * Alternative to WebSocket-based recording
 */
export async function recordWithScreenshots(
  durationMs: number,
  outputPath: string,
  options: GifRecordingOptions = {},
  session: string = "default"
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const frames: Buffer[] = [];
  const interval = 1000 / opts.frameRate;
  const startTime = Date.now();

  console.log(`Recording for ${durationMs}ms at ${opts.frameRate}fps...`);

  while (Date.now() - startTime < durationMs) {
    try {
      // Take screenshot via agent-browser
      const result = await new Promise<string>((resolve, reject) => {
        const proc = spawn("agent-browser", [
          "screenshot",
          "-s", session,
          "--format", "png",
          "--base64",
        ]);
        let stdout = "";
        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        proc.on("close", (code) => {
          if (code === 0) resolve(stdout.trim());
          else reject(new Error(`Screenshot failed with code ${code}`));
        });
      });

      const buffer = Buffer.from(result, "base64");
      frames.push(buffer);
    } catch (error) {
      console.warn("Frame capture failed:", error);
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  if (frames.length === 0) {
    throw new Error("No frames captured");
  }

  console.log(`Captured ${frames.length} frames, generating GIF...`);

  // Generate GIF with ffmpeg
  await generateGifFromFrames(frames, outputPath, opts);
  console.log(`GIF saved to: ${outputPath}`);
}

/**
 * Generate GIF from frame buffers
 */
async function generateGifFromFrames(
  frames: Buffer[],
  outputPath: string,
  options: Required<GifRecordingOptions>
): Promise<void> {
  const firstFrameMeta = await sharp(frames[0]).metadata();
  const width = options.width || firstFrameMeta.width || 800;
  const height = options.height || firstFrameMeta.height || 600;

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-f", "image2pipe",
      "-framerate", String(options.frameRate),
      "-i", "-",
      "-vf", `fps=${options.frameRate},scale=${width}:${height}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      "-loop", String(options.repeat),
      outputPath,
    ]);

    ffmpeg.on("error", (error) => {
      reject(new Error(`ffmpeg error: ${error.message}`));
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });

    (async () => {
      for (const frame of frames) {
        const png = await sharp(frame).png().toBuffer();
        ffmpeg.stdin.write(png);
      }
      ffmpeg.stdin.end();
    })();
  });
}
