import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { NodeConfig } from "../config";

export type XrayStatus = "running" | "stopped" | "restarting" | "error";

export class XrayManager {
  private process: ChildProcess | null = null;
  private status: XrayStatus = "stopped";
  private restartTimer: NodeJS.Timeout | null = null;
  private logBuffer: string[] = [];
  private readonly MAX_LOG_LINES = 500;

  constructor(private config: NodeConfig) {}

  getStatus(): XrayStatus {
    return this.status;
  }

  getLogs(): string[] {
    return this.logBuffer.slice(-this.config.logTailLines);
  }

  start(): void {
    if (this.process) {
      this.log("[xray-manager] Xray already running, skipping start.");
      return;
    }

    if (!fs.existsSync(this.config.xrayConfigPath)) {
      this.log(
        "[xray-manager] No config file found at " +
          this.config.xrayConfigPath +
          ". Waiting for first config push."
      );
      this.status = "stopped";
      return;
    }

    if (!fs.existsSync(this.config.xrayExecutable)) {
      this.log(
        "[xray-manager] Xray executable not found at " +
          this.config.xrayExecutable
      );
      this.status = "error";
      return;
    }

    this.log("[xray-manager] Starting Xray...");
    this.status = "running";

    this.process = spawn(this.config.xrayExecutable, [
      "run",
      "-c",
      this.config.xrayConfigPath,
    ]);

    this.process.stdout?.on("data", (data: Buffer) => {
      this.appendLog(data.toString());
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      this.appendLog(data.toString());
    });

    this.process.on("close", (code) => {
      this.log(`[xray-manager] Xray process exited with code ${code}`);
      this.process = null;
      if (this.status === "running") {
        // Unexpected exit — auto-restart after 3 seconds
        this.status = "error";
        this.log("[xray-manager] Scheduling auto-restart in 3s...");
        this.restartTimer = setTimeout(() => this.start(), 3000);
      }
    });

    this.process.on("error", (err) => {
      this.log("[xray-manager] Failed to start Xray: " + err.message);
      this.status = "error";
      this.process = null;
    });
  }

  stop(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (!this.process) return;
    this.log("[xray-manager] Stopping Xray...");
    this.status = "stopped";
    this.process.kill("SIGTERM");
    this.process = null;
  }

  restart(): void {
    this.log("[xray-manager] Restarting Xray...");
    this.status = "restarting";
    this.stop();
    setTimeout(() => this.start(), 500);
  }

  applyConfig(config: object): void {
    this.log("[xray-manager] Writing new config...");
    fs.writeFileSync(
      this.config.xrayConfigPath,
      JSON.stringify(config, null, 2),
      "utf-8"
    );
    this.log("[xray-manager] Config written. Restarting Xray...");
    this.restart();
  }

  private log(line: string): void {
    const ts = new Date().toISOString();
    const entry = `${ts}  ${line}`;
    console.log(entry);
    this.appendLog(entry);
  }

  private appendLog(text: string): void {
    const lines = text.split("\n").filter((l) => l.trim());
    this.logBuffer.push(...lines);
    if (this.logBuffer.length > this.MAX_LOG_LINES) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_LOG_LINES);
    }
  }
}
