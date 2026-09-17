import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

// Every error response from this API takes this shape, regardless of cause:
//   { "error": { "message": string, "code": string, "details"?: [...] } }
// This is the one place that decides what's safe to expose to the client
// vs. what gets logged and hidden behind a generic message.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  // Malformed JSON bodies are thrown by express.json() as a SyntaxError
  // before any route handler runs.
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: { message: "Malformed JSON in request body", code: "INVALID_JSON" },
    });
  }

  // Unexpected error: log the real detail server-side, never leak it to the client.
  console.error(err);
  return res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
}
