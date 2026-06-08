import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";

/**
 * Валидирует req.body по zod-схеме (общей с фронтендом).
 * При успехе кладёт распарсенное значение в res.locals.body.
 */
export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Ошибка валидации", details: result.error.flatten() });
      return;
    }
    res.locals.body = result.data as z.infer<S>;
    next();
  };
}
