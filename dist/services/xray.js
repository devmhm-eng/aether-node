"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrayManager = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
class XrayManager {
    constructor(config) {
        this.config = config;
        this.process = null;
        this.status = "stopped";
        this.restartTimer = null;
        this.logBuffer = [];
        this.MAX_LOG_LINES = 500;
    }
    getStatus() {
        return this.status;
    }
    getLogs() {
        return this.logBuffer.slice(-this.config.logTailLines);
    }
    start() {
        if (this.process) {
            this.log("[xray-manager] Xray already running, skipping start.");
            return;
        }
        if (!fs_1.default.existsSync(this.config.xrayConfigPath)) {
            this.log("[xray-manager] No config file found at " +
                this.config.xrayConfigPath +
                ". Waiting for first config push.");
            this.status = "stopped";
            return;
        }
        if (!fs_1.default.existsSync(this.config.xrayExecutable)) {
            this.log("[xray-manager] Xray executable not found at " +
                this.config.xrayExecutable);
            this.status = "error";
            return;
        }
        this.log("[xray-manager] Starting Xray...");
        this.status = "running";
        this.process = (0, child_process_1.spawn)(this.config.xrayExecutable, [
            "run",
            "-c",
            this.config.xrayConfigPath,
        ]);
        this.process.stdout?.on("data", (data) => {
            this.appendLog(data.toString());
        });
        this.process.stderr?.on("data", (data) => {
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
    stop() {
        if (this.restartTimer) {
            clearTimeout(this.restartTimer);
            this.restartTimer = null;
        }
        if (!this.process)
            return;
        this.log("[xray-manager] Stopping Xray...");
        this.status = "stopped";
        this.process.kill("SIGTERM");
        this.process = null;
    }
    restart() {
        this.log("[xray-manager] Restarting Xray...");
        this.status = "restarting";
        this.stop();
        setTimeout(() => this.start(), 500);
    }
    applyConfig(config) {
        this.log("[xray-manager] Writing new config...");
        fs_1.default.writeFileSync(this.config.xrayConfigPath, JSON.stringify(config, null, 2), "utf-8");
        this.log("[xray-manager] Config written. Restarting Xray...");
        this.restart();
    }
    log(line) {
        const ts = new Date().toISOString();
        const entry = `${ts}  ${line}`;
        console.log(entry);
        this.appendLog(entry);
    }
    appendLog(text) {
        const lines = text.split("\n").filter((l) => l.trim());
        this.logBuffer.push(...lines);
        if (this.logBuffer.length > this.MAX_LOG_LINES) {
            this.logBuffer = this.logBuffer.slice(-this.MAX_LOG_LINES);
        }
    }
}
exports.XrayManager = XrayManager;
