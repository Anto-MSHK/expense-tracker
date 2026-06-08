import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** Унифицированный формат ошибки API */
export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

/** 404 для неизвестных роутов */
export function notFound(_req: Request, res: Response<ApiErrorBody>) {
  res.status(404).json({ error: "Не найдено" });
}

/** Централизованный обработчик ошибок (в т.ч. ошибок валидации zod) */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiErrorBody>,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Ошибка валидации", details: err.flatten() });
    return;
  }

  console.error("Необработанная ошибка:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
}
