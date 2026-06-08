import { defineConfig } from "vitest/config";

// Отдельный конфиг для тестов: без PWA-плагина, окружение Node + fake-indexeddb.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
