import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Таблица статей расходов.
 *
 * Поля из ТЗ: id, name, sum, date. Добавлены created_at / updated_at —
 * нужны для предсказуемой сортировки и синхронизации (last-write-wins).
 *
 * - id     : UUID, генерируется КЛИЕНТОМ (offline-first), сервер делает upsert.
 * - sum    : numeric(12,2) — точный денежный тип Postgres, без float-погрешностей.
 * - date   : тип `date` — календарная дата статьи (без времени).
 */
export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sum: numeric("sum", { precision: 12, scale: 2 }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpenseRow = typeof expenses.$inferInsert;
