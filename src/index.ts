import express from "express";
import { loadConfig } from "./config";
import { XrayManager } from "./services/xray";
import { authMiddleware } from "./middleware/auth";
import { healthRouter } from "./routes/health";
import { configRouter } from "./routes/config";
import { statsRouter } from "./routes/stats";
import { logsRouter } from "./routes/logs";

const config = loadConfig();
const xray = new XrayManager(config);

const app = express();
app.use(express.json({ limit: "10mb" }));

// --- Public routes (no auth) ---
app.use("/health", healthRouter(xray));

// --- Protected routes ---
app.use("/api/config", authMiddleware(config.apiKey), configRouter(xray));
app.use("/api/stats", authMiddleware(config.apiKey), statsRouter(xray));
app.use("/api/logs", authMiddleware(config.apiKey), logsRouter(xray));

app.post(
  "/api/restart",
  authMiddleware(config.apiKey),
  (_req, res) => {
    xray.restart();
    res.json({ success: true, message: "Xray restart initiated." });
  }
);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start Xray if config already exists
xray.start();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[aether-node] Listening on port ${config.port}`);
  console.log(`[aether-node] Health check: http://0.0.0.0:${config.port}/health`);
});
