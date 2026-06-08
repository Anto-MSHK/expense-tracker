import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

// Проверяем валидацию и роутинг — пути, которые не доходят до БД.
const app = createApp();

describe("POST /expenses — валидация", () => {
  it("400 при пустом теле", async () => {
    const res = await request(app).post("/expenses").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Ошибка валидации");
  });

  it("400 при сумме вне диапазона", async () => {
    const res = await request(app).post("/expenses").send({
      id: "8f14e45f-ceea-467a-9f3c-2b6ad5b1f3aa",
      name: "Тест",
      sum: 0.5,
      date: "2026-06-08",
      createdAt: "2026-06-08T10:00:00.000Z",
    });
    expect(res.status).toBe(400);
  });

  it("400 при невалидном uuid", async () => {
    const res = await request(app).post("/expenses").send({
      id: "not-a-uuid",
      name: "Тест",
      sum: 10,
      date: "2026-06-08",
      createdAt: "2026-06-08T10:00:00.000Z",
    });
    expect(res.status).toBe(400);
  });
});

describe("роутинг", () => {
  it("404 на неизвестном пути", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});
