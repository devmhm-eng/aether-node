import { Router, Request, Response } from "express";

export function trafficRouter(): Router {
  const router = Router();

  /**
   * GET /api/stats/traffic?reset=true
   * Query Xray's stats API for per-user traffic.
   * Connects to Xray's internal gRPC API on 127.0.0.1:62050.
   *
   * Returns:
   * {
   *   users: [
   *     { username: "alice", upload: 1234, download: 5678 },
   *     { username: "bob",   upload: 9012, download: 3456 }
   *   ]
   * }
   */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const reset = req.query.reset === "true";

    try {
      const { XtlsApi } = await import("@remnawave/xtls-sdk");
      const client = new XtlsApi({ connectionUrl: "127.0.0.1:62050" });

      const result = await client.stats.getAllUsersStats(reset);

      if (!result.isOk) {
        res.status(502).json({ error: "Xray stats API error: " + result.message });
        return;
      }

      // result.data.users: Array<{ username, uplink, downlink }>
      const users = (result.data?.users ?? []).map((u) => ({
        username: u.username,
        upload: Number(u.uplink ?? 0),
        download: Number(u.downlink ?? 0),
      }));

      res.json({ users, reset });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to query Xray stats: " + (err as Error).message });
    }
  });

  return router;
}
