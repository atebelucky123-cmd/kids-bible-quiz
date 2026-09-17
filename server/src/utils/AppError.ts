// A known, expected error condition (bad input, not found, unauthorized...)
// as opposed to a genuine bug. The error handler uses this distinction to
// decide what's safe to show the client vs. what to log and hide.
export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
