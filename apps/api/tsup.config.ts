import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  // Бандлим воркспейс-пакет @expense/shared (он экспортирует исходный TS),
  // внешние node_modules оставляем внешними.
  noExternal: ["@expense/shared"],
  clean: true,
  sourcemap: true,
});
