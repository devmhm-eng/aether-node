"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = configRouter;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
function configRouter(xray) {
    const router = (0, express_1.Router)();
    /**
     * POST /api/config
     * Body: { config: <full Xray JSON config object> }
     * The main Aether panel calls this to push a new config and trigger a restart.
     */
    router.post("/", (req, res) => {
        const { config } = req.body;
        if (!config || typeof config !== "object") {
            res.status(400).json({ error: "Body must be { config: <object> }" });
            return;
        }
        // Basic sanity check — must have inbounds array
        const c = config;
        if (!Array.isArray(c.inbounds)) {
            res
                .status(400)
                .json({ error: "Config must contain an inbounds array" });
            return;
        }
        try {
            xray.applyConfig(config);
            res.json({ success: true, message: "Config applied. Xray restarting." });
        }
        catch (err) {
            res
                .status(500)
                .json({ error: "Failed to apply config: " + err.message });
        }
    });
    /**
     * GET /api/config
     * Returns the current config on disk (useful for debugging).
     */
    router.get("/", (req, res) => {
        const { xrayConfigPath } = xray.config;
        if (!fs_1.default.existsSync(xrayConfigPath)) {
            res.status(404).json({ error: "No config file exists yet" });
            return;
        }
        try {
            const raw = fs_1.default.readFileSync(xrayConfigPath, "utf-8");
            res.json({ config: JSON.parse(raw) });
        }
        catch {
            res.status(500).json({ error: "Failed to read config file" });
        }
    });
    return router;
}
