"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.trafficRouter = trafficRouter;
const express_1 = require("express");
function trafficRouter() {
    const router = (0, express_1.Router)();
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
    router.get("/", async (req, res) => {
        const reset = req.query.reset === "true";
        try {
            const { XtlsApi } = await Promise.resolve().then(() => __importStar(require("@remnawave/xtls-sdk")));
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
        }
        catch (err) {
            res
                .status(500)
                .json({ error: "Failed to query Xray stats: " + err.message });
        }
    });
    return router;
}
