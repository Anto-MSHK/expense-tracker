import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { expensesRouter } from "./routes/expenses.js";
import { healthRouter } from "./routes/health.js";

/** Фабрика Express-приложения (удобно для тестов) */
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/expenses", expensesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
