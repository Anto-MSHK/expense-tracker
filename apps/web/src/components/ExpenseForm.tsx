import { NAME_MAX, NAME_MIN, SUM_MAX, SUM_MIN, expenseFormSchema } from "@expense/shared";
import { type FormEvent, useEffect, useState } from "react";
import type { LocalExpense } from "../lib/idb.js";
import { addExpense, updateExpense } from "../lib/store.js";

/** Сегодняшняя дата в локальном поясе как YYYY-MM-DD */
function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type FieldErrors = Partial<Record<"name" | "sum" | "date", string>>;

interface Props {
  /** Редактируемая статья (null — режим создания) */
  editing: LocalExpense | null;
  /** Вызывается после сохранения/отмены — родитель сбрасывает режим редактирования */
  onDone: () => void;
}

export function ExpenseForm({ editing, onDone }: Props) {
  const [name, setName] = useState("");
  const [sum, setSum] = useState("");
  const [date, setDate] = useState(todayISO());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = editing !== null;

  // Подставляем значения при входе в режим редактирования.
  // biome-ignore lint/correctness/useExhaustiveDependencies: синхронизируемся по id статьи
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSum(String(editing.sum));
      setDate(editing.date);
      setErrors({});
    }
  }, [editing?.id]);

  function reset() {
    setName("");
    setSum("");
    setDate(todayISO());
    setErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const candidate = { name, sum: sum === "" ? Number.NaN : Number(sum), date };
    const result = expenseFormSchema.safeParse(candidate);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], sum: flat.sum?.[0], date: flat.date?.[0] });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (editing) {
        await updateExpense(editing.id, result.data);
      } else {
        await addExpense(result.data);
      }
      reset();
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    reset();
    onDone();
  }

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      <h2 className="card__title">{isEdit ? "Редактирование статьи" : "Новая статья расхода"}</h2>

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
          Сумма, ₽
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
          {errors.sum ?? `От ${SUM_MIN.toFixed(2)} до ${SUM_MAX.toLocaleString("ru-RU")}.00 ₽`}
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

      <div className="form__actions">
        <button className="button button--primary" type="submit" disabled={submitting}>
          {submitting ? "Сохраняю…" : isEdit ? "Сохранить изменения" : "Добавить расход"}
        </button>
        {isEdit && (
          <button className="button button--ghost" type="button" onClick={handleCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
