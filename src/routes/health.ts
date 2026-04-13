import { Router } from "express";
import { XrayManager } from "../services/xray";
import os from "os";

export function healthRouter(xray: XrayManager): Router {
  const router = Router();

  // GET /health  — no auth, used by the main panel for connectivity checks
  router.get("/", (_req, res) => {
    const uptime = process.uptime();
    res.json({
      status: "ok",
      xray: xray.getStatus(),
      system: {
        uptime: Math.floor(uptime),
        loadAvg: os.loadavg(),
        freeMemMB: Math.round(os.freemem() / 1024 / 1024),
        totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      },
    });
  });

  return router;
}
