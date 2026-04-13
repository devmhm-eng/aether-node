"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRouter = logsRouter;
const express_1 = require("express");
function logsRouter(xray) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/logs
     * Returns the recent Xray log lines captured by the process manager.
     * Query params:
     *   ?lines=100  — how many lines to return (max 500)
     */
    router.get("/", (req, res) => {
        const lines = Math.min(500, parseInt(req.query.lines ?? "200", 10));
        const all = xray.getLogs();
        res.json({ lines: all.slice(-lines) });
    });
    return router;
}
