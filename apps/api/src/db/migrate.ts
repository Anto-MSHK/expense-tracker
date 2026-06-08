import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./index.js";

/** Применяет SQL-миграции из ./drizzle к базе. Запускается скриптом db:migrate. */
async function main() {
  console.log("⏳ Применяю миграции…");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("✅ Миграции применены");
  await sql.end();
}

main().catch((err) => {
  console.error("❌ Ошибка миграции:", err);
  process.exit(1);
});
