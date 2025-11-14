/**
 * Request logging middleware
 */

import { Request, Response, NextFunction } from "express";
import { logRequest } from "../../utils/logger";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Skip logging for health checks and root endpoint
  if (req.path === "/health" || req.path === "/") {
    return next();
  }

  // Log request completion
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const userAgent = req.get("User-Agent");

    logRequest(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      userAgent
    );
  });

  next();
}
