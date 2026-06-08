import { sql as drizzleSql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";

export const healthRouter = Router();

/**
 * Health-чек для живого индикатора подключения на фронте.
 * Пингует БД, чтобы статус «online» означал именно доступность бэка+базы,
 * а не просто то, что процесс жив.
 */
healthRouter.get("/", async (_req, res) => {
  try {
    await db.execute(drizzleSql`select 1`);
    res.json({ status: "ok", db: "up", time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", db: "down", time: new Date().toISOString() });
  }
});
