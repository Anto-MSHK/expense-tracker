import { z } from "zod";

/**
 * Единый источник правды для валидации и типов.
 * Импортируется и фронтендом, и бэкендом — правила валидации не дублируются.
 */

// --- Ограничения из ТЗ ---
export const NAME_MIN = 3;
export const NAME_MAX = 30;
/** Сумма в основных единицах (рублях) */
export const SUM_MIN = 1; // 1.00
export const SUM_MAX = 1_000_000; // 1 000 000.00

/**
 * Сумма хранится и валидируется как число с точностью до 2 знаков.
 * Расчёты (итоги) выполняются в целых минорных единицах (копейках),
 * чтобы избежать ошибок плавающей точки — см. money-хелперы ниже.
 */
const sumSchema = z
  .number({ invalid_type_error: "Сумма должна быть числом" })
  .gte(SUM_MIN, `Минимум ${SUM_MIN.toFixed(2)} ₽`)
  .lte(SUM_MAX, `Максимум ${SUM_MAX.toLocaleString("ru-RU")}.00 ₽`)
  .refine(
    (value) =>
      Number.isInteger(Math.round(value * 100)) &&
      Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
    { message: "Не более двух знаков после запятой" },
  );

const nameSchema = z
  .string({ invalid_type_error: "Название должно быть строкой" })
  .trim()
  .min(NAME_MIN, `Минимум ${NAME_MIN} символа`)
  .max(NAME_MAX, `Максимум ${NAME_MAX} символов`);

/** Любая дата в формате YYYY-MM-DD (по ТЗ — «любая») */
const dateSchema = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)), {
    message: "Некорректная дата",
  });

/** Поля, которые заполняет пользователь в форме */
export const expenseFormSchema = z.object({
  name: nameSchema,
  sum: sumSchema,
  date: dateSchema,
});
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

/**
 * Тело запроса на создание. `id` генерируется клиентом (UUID) ради
 * offline-first: запись имеет стабильный идентификатор ещё до похода на сервер,
 * а upsert по id делает повторную отправку из очереди идемпотентной.
 */
export const createExpenseSchema = expenseFormSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/** Полная запись, как её отдаёт API */
export const expenseSchema = createExpenseSchema.extend({
  updatedAt: z.string().datetime(),
});
export type Expense = z.infer<typeof expenseSchema>;

// --- Money-хелперы (расчёты в целых минорных единицах) ---

/** 12.34 у.е. -> 1234 копейки */
export function toMinorUnits(sum: number): number {
  return Math.round(sum * 100);
}

/** 1234 копейки -> 12.34 у.е. */
export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

/** Точный итог по списку расходов (складываем копейки, не у.е.) */
export function sumExpenses(expenses: Array<Pick<Expense, "sum">>): number {
  const totalMinor = expenses.reduce((acc, e) => acc + toMinorUnits(e.sum), 0);
  return fromMinorUnits(totalMinor);
}

/** Форматирование суммы для UI: 1234.5 -> "1 234,50 ₽" */
export function formatMoney(sum: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(sum);
}
