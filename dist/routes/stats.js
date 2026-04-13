"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = statsRouter;
const express_1 = require("express");
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
function statsRouter(xray) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/stats
     * Returns system resource stats and Xray process status.
     */
    router.get("/", (_req, res) => {
        const cpus = os_1.default.cpus();
        const loadAvg = os_1.default.loadavg();
        // Simple CPU usage estimate from load avg vs cores
        const cpuCount = cpus.length;
        const cpuUsagePercent = Math.min(100, Math.round((loadAvg[0] / cpuCount) * 100));
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        // Disk usage for root partition (Linux only, best-effort)
        let disk = null;
        try {
            if (process.platform === "linux") {
                const stat = fs_1.default.statfsSync("/");
                disk = {
                    total: stat.blocks * stat.bsize,
                    used: (stat.blocks - stat.bfree) * stat.bsize,
                    free: stat.bfree * stat.bsize,
                };
            }
        }
        catch {
            // statfs may not be available on older Node versions
        }
        res.json({
            xray: xray.getStatus(),
            cpu: {
                cores: cpuCount,
                model: cpus[0]?.model ?? "unknown",
                loadAvg,
                usagePercent: cpuUsagePercent,
            },
            memory: {
                totalMB: Math.round(totalMem / 1024 / 1024),
                usedMB: Math.round(usedMem / 1024 / 1024),
                freeMB: Math.round(freeMem / 1024 / 1024),
                usagePercent: Math.round((usedMem / totalMem) * 100),
            },
            disk,
            uptime: Math.floor(os_1.default.uptime()),
            nodeUptime: Math.floor(process.uptime()),
        });
    });
    return router;
}
