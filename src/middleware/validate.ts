import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export function validate(schema: ZodTypeAny) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        req.query = parsed.query as typeof req.query;
      }
      if (parsed.params !== undefined) {
        req.params = parsed.params as typeof req.params;
      }

      res.locals.validated = {
        ...(res.locals.validated || {}),
        ...parsed,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
