import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import * as schema from "./schema.js";

/** Пул соединений postgres-js */
export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  onnotice: () => {}, // не шумим NOTICE'ами в логах
});

export const db = drizzle(sql, { schema });

export { schema };
