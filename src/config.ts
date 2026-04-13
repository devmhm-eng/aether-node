import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

export interface NodeConfig {
  port: number;
  apiKey: string;
  xrayExecutable: string;
  xrayConfigPath: string;
  xrayLogDir: string;
  logTailLines: number;
}

function required(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`[aether-node] Missing required env variable: ${name}`);
    process.exit(1);
  }
  return val;
}

export function loadConfig(): NodeConfig {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "change_me_to_a_random_secret") {
    console.error(
      "[aether-node] API_KEY is not set or is still the default. Set a strong random key in .env"
    );
    process.exit(1);
  }

  const xrayConfigPath =
    process.env.XRAY_CONFIG_PATH ?? "/etc/xray/config.json";

  // Ensure the config directory exists
  const configDir = path.dirname(xrayConfigPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
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
