import { Router, Request, Response } from "express";
import { XrayManager } from "../services/xray";

export function logsRouter(xray: XrayManager): Router {
  const router = Router();

  /**
   * GET /api/logs
   * Returns the recent Xray log lines captured by the process manager.
   * Query params:
   *   ?lines=100  — how many lines to return (max 500)
   */
  router.get("/", (req: Request, res: Response): void => {
    const lines = Math.min(
      500,
      parseInt((req.query.lines as string) ?? "200", 10)
    );
    const all = xray.getLogs();
    res.json({ lines: all.slice(-lines) });
  });

  return router;
}
