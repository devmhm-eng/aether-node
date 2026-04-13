"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
function authMiddleware(apiKey) {
    return (req, res, next) => {
        const key = req.headers["x-api-key"];
        if (!key || key !== apiKey) {
            res.status(401).json({ error: "Unauthorized: invalid API key" });
            return;
        }
        next();
    };
}
