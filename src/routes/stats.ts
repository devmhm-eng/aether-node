import { Router, Request, Response } from "express";
import { XrayManager } from "../services/xray";
import os from "os";
import fs from "fs";

export function statsRouter(xray: XrayManager): Router {
  const router = Router();

  /**
   * GET /api/stats
   * Returns system resource stats and Xray process status.
   */
  router.get("/", (_req: Request, res: Response): void => {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Simple CPU usage estimate from load avg vs cores
    const cpuCount = cpus.length;
    const cpuUsagePercent = Math.min(
      100,
      Math.round((loadAvg[0] / cpuCount) * 100)
    );

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Disk usage for root partition (Linux only, best-effort)
    let disk: { total: number; used: number; free: number } | null = null;
    try {
      if (process.platform === "linux") {
        const stat = fs.statfsSync("/");
        disk = {
          total: stat.blocks * stat.bsize,
          used: (stat.blocks - stat.bfree) * stat.bsize,
          free: stat.bfree * stat.bsize,
        };
      }
    } catch {
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
      uptime: Math.floor(os.uptime()),
      nodeUptime: Math.floor(process.uptime()),
    });
  });

  return router;
}
