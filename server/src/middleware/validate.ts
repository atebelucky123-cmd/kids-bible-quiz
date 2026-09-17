import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

// Validates (and replaces) req.body/query/params against the given Zod
// schemas. On failure, passes the ZodError to the central error handler,
// which turns it into the standard { error: { ... } } shape with
// field-level details. Every route that accepts input should use this
// rather than validating ad hoc inside the controller.
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };
}
