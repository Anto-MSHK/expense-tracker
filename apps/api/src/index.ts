import { createApp } from "./app.js";
import { env } from "./env.js";

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
