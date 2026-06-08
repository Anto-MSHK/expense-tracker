import { formatMoney, sumExpenses } from "@expense/shared";
import { useMemo, useState } from "react";
import type { LocalExpense } from "../lib/idb.js";

type SortKey = "date-desc" | "date-asc" | "sum-desc" | "sum-asc";

const SORTS: Record<SortKey, string> = {
  "date-desc": "Сначала новые",
  "date-asc": "Сначала старые",
  "sum-desc": "Сумма ↓",
  "sum-asc": "Сумма ↑",
};

interface Props {
  items: LocalExpense[];
  editingId: string | null;
  onEdit: (item: LocalExpense) => void;
  onDelete: (item: LocalExpense) => void;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function sortItems(items: LocalExpense[], key: SortKey): LocalExpense[] {
  const by = [...items];
  switch (key) {
    case "date-asc":
      return by.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
    case "sum-desc":
      return by.sort((a, b) => b.sum - a.sum);
    case "sum-asc":
      return by.sort((a, b) => a.sum - b.sum);
    default:
      return by; // date-desc — стор уже отдаёт в этом порядке
  }
}

export function ExpenseList({ items, editingId, onEdit, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? items.filter((e) => e.name.toLowerCase().includes(q)) : items;
    return sortItems(filtered, sort);
  }, [items, query, sort]);

  const total = sumExpenses(shown);

  return (
    <section className="list card">
      <div className="list__header">
        <h2 className="card__title">Статьи расходов</h2>
        <span className="list__count">{shown.length}</span>
      </div>

      {items.length > 0 && (
        <div className="list__controls">
          <input
            className="field__input list__search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию…"
            aria-label="Поиск по названию"
          />
          <select
            className="field__input list__sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Сортировка"
          >
            {Object.entries(SORTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {items.length === 0 ? (
        <div className="list__empty">
          <img className="list__empty-img" src="/empty-state.png" alt="" />
          <p>
            Пока нет ни одной статьи.
            <br />
            Добавьте первую — она появится здесь.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <p className="list__empty">Ничего не найдено по запросу «{query}».</p>
      ) : (
        <ul className="list__items">
          {shown.map((item) => (
            <li
              key={item.id}
              className={`expense ${item.pendingOp ? "expense--pending" : ""} ${
                item.id === editingId ? "expense--editing" : ""
              }`}
            >
              <div className="expense__main">
                <span className="expense__name">{item.name}</span>
                <span className="expense__date">{formatDate(item.date)}</span>
              </div>
              <div className="expense__side">
                <span className="expense__sum">{formatMoney(item.sum)}</span>
                {item.pendingOp === "create" && (
                  <span className="expense__badge" title="Ещё не синхронизировано">
                    не синхр.
                  </span>
                )}
              </div>
              <div className="expense__actions">
                <button
                  className="expense__action"
                  type="button"
                  onClick={() => onEdit(item)}
                  aria-label={`Редактировать «${item.name}»`}
                  title="Редактировать"
                >
                  ✎
                </button>
                <button
                  className="expense__action expense__action--delete"
                  type="button"
                  onClick={() => onDelete(item)}
                  aria-label={`Удалить «${item.name}»`}
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="list__total">
        <span>Итого{query.trim() ? " (по фильтру)" : ""}</span>
        <strong>{formatMoney(total)}</strong>
      </footer>
    </section>
  );
}
