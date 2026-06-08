import { type CreateExpenseInput, createExpenseSchema, type Expense, sumExpenses } from "@expense/shared";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { expenses, type ExpenseRow } from "../db/schema.js";
import { validateBody } from "../middleware/validate.js";

export const expensesRouter = Router();

/** Маппинг строки БД в DTO API (numeric -> number, Date -> ISO-строка) */
function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    name: row.name,
    sum: Number(row.sum),
    date: row.date,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** GET /expenses — список статей + итоговая сумма */
expensesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.date), desc(expenses.createdAt));
    const items = rows.map(rowToExpense);
    res.json({ items, total: sumExpenses(items), count: items.length });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /expenses — создание статьи.
 * Идемпотентный upsert по client-generated id: повторная отправка из offline-очереди
 * не плодит дубли (last-write-wins по содержимому).
 */
expensesRouter.post("/", validateBody(createExpenseSchema), async (_req, res, next) => {
  try {
    const input = res.locals.body as CreateExpenseInput;
    const [row] = await db
      .insert(expenses)
      .values({
        id: input.id,
        name: input.name,
        sum: input.sum.toFixed(2),
        date: input.date,
        createdAt: new Date(input.createdAt),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: expenses.id,
        set: {
          name: input.name,
          sum: input.sum.toFixed(2),
          date: input.date,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.status(201).json(rowToExpense(row!));
  } catch (err) {
    next(err);
  }
});

/** DELETE /expenses/:id — удаление статьи (идемпотентно: 204 даже если уже удалена) */
expensesRouter.delete("/:id", async (req, res, next) => {
  try {
    await db.delete(expenses).where(eq(expenses.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
