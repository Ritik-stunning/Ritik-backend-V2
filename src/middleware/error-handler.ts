import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message:
        err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ") ||
        "Validation failed",
      details: err.issues,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.constructor.name,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status: number }).status === 400
  ) {
    return res.status(400).json({
      error: "BadRequestError",
      message: "Invalid JSON in request body",
    });
  }

  logger.error({ err }, "Unhandled server error");
  return res.status(500).json({
    error: "InternalServerError",
    message: "Internal server error",
  });
}
