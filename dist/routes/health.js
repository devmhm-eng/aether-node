"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = healthRouter;
const express_1 = require("express");
const os_1 = __importDefault(require("os"));
function healthRouter(xray) {
    const router = (0, express_1.Router)();
    // GET /health  — no auth, used by the main panel for connectivity checks
    router.get("/", (_req, res) => {
        const uptime = process.uptime();
        res.json({
            status: "ok",
            xray: xray.getStatus(),
            system: {
                uptime: Math.floor(uptime),
                loadAvg: os_1.default.loadavg(),
                freeMemMB: Math.round(os_1.default.freemem() / 1024 / 1024),
                totalMemMB: Math.round(os_1.default.totalmem() / 1024 / 1024),
            },
        });
    });
    return router;
}
