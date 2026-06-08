// Express как Vercel Serverless Function.
// Импортируем заранее собранный (tsup) бандл — функция на чистом JS,
// поэтому @vercel/node бандлит её без type-check (избегаем конфликта типов Express).
import { createApp } from "../apps/api/dist/app.js";

const app = createApp();

export default function handler(req, res) {
  // /api/expenses -> /expenses (роуты Express живут в корне)
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return app(req, res);
}
