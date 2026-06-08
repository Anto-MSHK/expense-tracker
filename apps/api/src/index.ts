import { createApp } from "./app.js";
import { env } from "./env.js";

async function bootstrap() {
  // В контейнере (docker compose) применяем миграции на старте,
  // чтобы поднять весь стек одной командой. В dev используется `pnpm db:migrate`.
  if (process.env.MIGRATE_ON_START === "true") {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { db } = await import("./db/index.js");
    console.log("⏳ Применяю миграции…");
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("✅ Миграции применены");
  }

  const app = createApp();

  const server = app.listen(env.API_PORT, () => {
    console.log(`🚀 API слушает http://localhost:${env.API_PORT}`);
    console.log(`   CORS origin: ${env.CORS_ORIGIN}`);
  });

  // Аккуратное завершение
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      console.log(`\n${signal} — завершаюсь…`);
      server.close(() => process.exit(0));
    });
  }
}

bootstrap().catch((err) => {
  console.error("❌ Не удалось запустить сервер:", err);
  process.exit(1);
});
