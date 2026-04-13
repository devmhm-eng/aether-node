import { Router, Request, Response } from "express";
import { XrayManager } from "../services/xray";
import fs from "fs";

export function configRouter(xray: XrayManager): Router {
  const router = Router();

  /**
   * POST /api/config
   * Body: { config: <full Xray JSON config object> }
   * The main Aether panel calls this to push a new config and trigger a restart.
   */
  router.post("/", (req: Request, res: Response): void => {
    const { config } = req.body as { config?: object };

    if (!config || typeof config !== "object") {
      res.status(400).json({ error: "Body must be { config: <object> }" });
      return;
    }

    // Basic sanity check — must have inbounds array
    const c = config as Record<string, unknown>;
    if (!Array.isArray(c.inbounds)) {
      res
        .status(400)
        .json({ error: "Config must contain an inbounds array" });
      return;
    }

    try {
      xray.applyConfig(config);
      res.json({ success: true, message: "Config applied. Xray restarting." });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to apply config: " + (err as Error).message });
    }
  });

  /**
   * GET /api/config
   * Returns the current config on disk (useful for debugging).
   */
  router.get("/", (req: Request, res: Response): void => {
    const { xrayConfigPath } = (xray as unknown as { config: { xrayConfigPath: string } }).config;
    if (!fs.existsSync(xrayConfigPath)) {
      res.status(404).json({ error: "No config file exists yet" });
      return;
    }
    try {
      const raw = fs.readFileSync(xrayConfigPath, "utf-8");
      res.json({ config: JSON.parse(raw) });
    } catch {
      res.status(500).json({ error: "Failed to read config file" });
    }
  });

  return router;
}
