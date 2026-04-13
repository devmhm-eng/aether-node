import { Request, Response, NextFunction } from "express";

export function authMiddleware(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.headers["x-api-key"];
    if (!key || key !== apiKey) {
      res.status(401).json({ error: "Unauthorized: invalid API key" });
      return;
    }
    next();
  };
}
