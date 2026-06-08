import { z } from "zod";

/**
 * Вся конфигурация — через environment variables (требование ТЗ).
 * Валидируем на старте: упасть с понятной ошибкой лучше, чем словить
 * undefined где-то в рантайме.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL должен быть валидной строкой подключения"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Некорректная конфигурация окружения:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
