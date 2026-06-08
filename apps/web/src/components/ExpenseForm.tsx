import { expenseFormSchema, NAME_MAX, NAME_MIN, SUM_MAX, SUM_MIN } from "@expense/shared";
import { type FormEvent, useState } from "react";
import { addExpense } from "../lib/store.js";

/** Сегодняшняя дата в локальном поясе как YYYY-MM-DD */
function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type FieldErrors = Partial<Record<"name" | "sum" | "date", string>>;

export function ExpenseForm() {
  const [name, setName] = useState("");
  const [sum, setSum] = useState("");
  const [date, setDate] = useState(todayISO());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const candidate = {
      name,
      sum: sum === "" ? Number.NaN : Number(sum),
      date,
    };

    const result = expenseFormSchema.safeParse(candidate);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        sum: flat.sum?.[0],
        date: flat.date?.[0],
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await addExpense(result.data);
      setName("");
      setSum("");
      setDate(todayISO());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      <h2 className="card__title">Новая статья расхода</h2>

      <div className="field">
        <label className="field__label" htmlFor="name">
          Название статьи
        </label>
        <input
          id="name"
          className={`field__input ${errors.name ? "field__input--error" : ""}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, продукты"
          maxLength={NAME_MAX + 10}
          aria-invalid={Boolean(errors.name)}
        />
        <span className="field__hint">
          {errors.name ?? `От ${NAME_MIN} до ${NAME_MAX} символов`}
        </span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="sum">
          Сумма, у.е.
        </label>
        <input
          id="sum"
          className={`field__input ${errors.sum ? "field__input--error" : ""}`}
          type="number"
          inputMode="decimal"
          step="0.01"
          min={SUM_MIN}
          max={SUM_MAX}
          value={sum}
          onChange={(e) => setSum(e.target.value)}
          placeholder="0.00"
          aria-invalid={Boolean(errors.sum)}
        />
        <span className="field__hint">
          {errors.sum ?? `От ${SUM_MIN.toFixed(2)} до ${SUM_MAX.toLocaleString("ru-RU")}.00`}
        </span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="date">
          Дата
        </label>
        <input
          id="date"
          className={`field__input ${errors.date ? "field__input--error" : ""}`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={Boolean(errors.date)}
        />
        <span className="field__hint">{errors.date ?? "Любая дата"}</span>
      </div>

      <button className="button button--primary" type="submit" disabled={submitting}>
        {submitting ? "Сохраняю…" : "Добавить расход"}
      </button>
    </form>
  );
}
