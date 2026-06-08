import { formatMoney } from "@expense/shared";
import type { LocalExpense } from "../lib/idb.js";
import { removeExpense } from "../lib/store.js";

interface Props {
  items: LocalExpense[];
  total: number;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

export function ExpenseList({ items, total }: Props) {
  return (
    <section className="list card">
      <div className="list__header">
        <h2 className="card__title">Статьи расходов</h2>
        <span className="list__count">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="list__empty">
          <img className="list__empty-img" src="/empty-state.png" alt="" />
          <p>
            Пока нет ни одной статьи.
            <br />
            Добавьте первую — она появится здесь.
          </p>
        </div>
      ) : (
        <ul className="list__items">
          {items.map((item) => (
            <li key={item.id} className={`expense ${item.pendingOp ? "expense--pending" : ""}`}>
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
              <button
                className="expense__delete"
                type="button"
                onClick={() => void removeExpense(item.id)}
                aria-label={`Удалить «${item.name}»`}
                title="Удалить"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="list__total">
        <span>Итого</span>
        <strong>{formatMoney(total)}</strong>
      </footer>
    </section>
  );
}
