import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Дамми-окружение: тесты ниже проверяют валидацию/роутинг и не ходят в БД.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      NODE_ENV: "test",
    },
  },
});
