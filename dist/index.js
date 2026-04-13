"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const xray_1 = require("./services/xray");
const auth_1 = require("./middleware/auth");
const health_1 = require("./routes/health");
const config_2 = require("./routes/config");
const stats_1 = require("./routes/stats");
const logs_1 = require("./routes/logs");
const traffic_1 = require("./routes/traffic");
const config = (0, config_1.loadConfig)();
const xray = new xray_1.XrayManager(config);
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "10mb" }));
// --- Public routes (no auth) ---
app.use("/health", (0, health_1.healthRouter)(xray));
// --- Protected routes ---
app.use("/api/config", (0, auth_1.authMiddleware)(config.apiKey), (0, config_2.configRouter)(xray));
app.use("/api/stats", (0, auth_1.authMiddleware)(config.apiKey), (0, stats_1.statsRouter)(xray));
app.use("/api/logs", (0, auth_1.authMiddleware)(config.apiKey), (0, logs_1.logsRouter)(xray));
app.use("/api/stats/traffic", (0, auth_1.authMiddleware)(config.apiKey), (0, traffic_1.trafficRouter)());
app.post("/api/restart", (0, auth_1.authMiddleware)(config.apiKey), (_req, res) => {
    xray.restart();
    res.json({ success: true, message: "Xray restart initiated." });
});
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
