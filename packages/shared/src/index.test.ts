import { describe, expect, it } from "vitest";
import {
  createExpenseSchema,
  expenseFormSchema,
  formatMoney,
  sumExpenses,
  toMinorUnits,
} from "./index.js";

describe("expenseFormSchema", () => {
  const valid = { name: "Кофе", sum: 4.5, date: "2026-06-08" };

  it("принимает корректные данные", () => {
    expect(expenseFormSchema.safeParse(valid).success).toBe(true);
  });

  it("отклоняет короткое название (< 3)", () => {
    expect(expenseFormSchema.safeParse({ ...valid, name: "ab" }).success).toBe(false);
  });

  it("отклоняет длинное название (> 30)", () => {
    expect(expenseFormSchema.safeParse({ ...valid, name: "x".repeat(31) }).success).toBe(false);
  });

  it("обрезает пробелы в названии", () => {
    const parsed = expenseFormSchema.parse({ ...valid, name: "  Обед  " });
    expect(parsed.name).toBe("Обед");
  });

  it("отклоняет сумму меньше 1.00", () => {
    expect(expenseFormSchema.safeParse({ ...valid, sum: 0.99 }).success).toBe(false);
  });

  it("отклоняет сумму больше 1 000 000.00", () => {
    expect(expenseFormSchema.safeParse({ ...valid, sum: 1_000_000.01 }).success).toBe(false);
  });

  it("отклоняет более двух знаков после запятой", () => {
    expect(expenseFormSchema.safeParse({ ...valid, sum: 4.555 }).success).toBe(false);
  });

  it("отклоняет некорректную дату", () => {
    expect(expenseFormSchema.safeParse({ ...valid, date: "2026-13-40" }).success).toBe(false);
  });
});

describe("createExpenseSchema", () => {
  it("требует валидный uuid и createdAt", () => {
    const ok = createExpenseSchema.safeParse({
      id: "8f14e45f-ceea-467a-9f3c-2b6ad5b1f3aa",
      name: "Кофе",
      sum: 4.5,
      date: "2026-06-08",
      createdAt: "2026-06-08T10:00:00.000Z",
    });
    expect(ok.success).toBe(true);
    expect(createExpenseSchema.safeParse({ id: "not-uuid" }).success).toBe(false);
  });
});

describe("money-хелперы", () => {
  it("toMinorUnits округляет до копеек", () => {
    expect(toMinorUnits(12.34)).toBe(1234);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30); // классическая ловушка float
  });

  it("sumExpenses точно складывает (без float-погрешности)", () => {
    const total = sumExpenses([{ sum: 0.1 }, { sum: 0.2 }] as never);
    expect(total).toBe(0.3);
  });

  it("formatMoney форматирует по-русски", () => {
    // toLocaleString использует узкий неразрывный пробел — нормализуем перед сравнением.
    const normalized = formatMoney(1234.5).replace(/\s/g, " ");
    expect(normalized).toBe("1 234,50 ₽");
  });
});
