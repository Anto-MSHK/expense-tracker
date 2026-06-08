import { defineConfig } from "drizzle-kit";

// drizzle-kit читает .env через флаг --env или process.env; в dev запускаем
// через скрипты, которым окружение прокидывает dotenv/докер.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://expense:expense@localhost:5432/expense_tracker",
  },
  verbose: true,
  strict: true,
});
