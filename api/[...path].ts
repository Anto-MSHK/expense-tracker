import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../apps/api/src/app.js";

// Express-приложение как Vercel Serverless Function.
// Vercel направляет сюда все /api/* запросы; срезаем префикс /api,
// т.к. роуты Express живут в корне (/health, /expenses).
const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return (app as unknown as (req: VercelRequest, res: VercelResponse) => void)(req, res);
}
