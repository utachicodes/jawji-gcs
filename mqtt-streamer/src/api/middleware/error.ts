/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../../utils/logger";

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error("API error occurred", {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    user_agent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Create error response
  const errorResponse = {
    error: getErrorType(statusCode),
    message: error.message || "Internal server error",
    timestamp: new Date().toISOString(),
    ...(error.details && { details: error.details }),
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 422:
      return "Validation Error";
    case 429:
      return "Too Many Requests";
    case 500:
      return "Internal Server Error";
    case 502:
      return "Bad Gateway";
    case 503:
      return "Service Unavailable";
    default:
      return "Error";
  }
}

export function createApiError(
  message: string,
  statusCode: number = 500,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
