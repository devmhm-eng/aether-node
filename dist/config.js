"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
function required(name) {
    const val = process.env[name];
    if (!val) {
        console.error(`[aether-node] Missing required env variable: ${name}`);
        process.exit(1);
    }
    return val;
}
function loadConfig() {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "change_me_to_a_random_secret") {
        console.error("[aether-node] API_KEY is not set or is still the default. Set a strong random key in .env");
        process.exit(1);
    }
    const xrayConfigPath = process.env.XRAY_CONFIG_PATH ?? "/etc/xray/config.json";
    // Ensure the config directory exists
    const configDir = path_1.default.dirname(xrayConfigPath);
    if (!fs_1.default.existsSync(configDir)) {
        fs_1.default.mkdirSync(configDir, { recursive: true });
    }
    return {
        port: parseInt(process.env.PORT ?? "2096", 10),
        apiKey,
        xrayExecutable: process.env.XRAY_EXECUTABLE ?? "/usr/local/bin/xray",
        xrayConfigPath,
        xrayLogDir: process.env.XRAY_LOG_DIR ?? "/var/log/xray",
        logTailLines: parseInt(process.env.LOG_TAIL_LINES ?? "200", 10),
    };
}
