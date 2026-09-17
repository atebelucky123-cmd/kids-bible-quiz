import { test } from "node:test";
import assert from "node:assert/strict";
import { z, ZodError } from "zod";
import { validate } from "./validate";

function mockReqRes(body: unknown) {
  const req = { body, query: {}, params: {} } as any;
  const res = {} as any;
  return { req, res };
}

test("validate() passes through and coerces valid input", () => {
  const schema = z.object({ age: z.coerce.number().int().min(5).max(12) });
  const middleware = validate({ body: schema });
  const { req, res } = mockReqRes({ age: "9" });

  let nextArg: unknown = "not-called";
  middleware(req, res, (err?: unknown) => {
    nextArg = err;
  });

  assert.equal(nextArg, undefined, "next() should be called with no error");
  assert.equal(req.body.age, 9, "coerced string '9' should become number 9");
});

test("validate() passes a ZodError to next() on invalid input", () => {
  const schema = z.object({ age: z.coerce.number().int().min(5).max(12) });
  const middleware = validate({ body: schema });
  const { req, res } = mockReqRes({ age: "15" });

  let nextArg: unknown = "not-called";
  middleware(req, res, (err?: unknown) => {
    nextArg = err;
  });

  assert.ok(nextArg instanceof ZodError, "next() should receive a ZodError");
});
