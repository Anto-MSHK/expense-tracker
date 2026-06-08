import { useEffect, useState } from "react";
import { ExpenseForm } from "./components/ExpenseForm.js";
import { ExpenseList } from "./components/ExpenseList.js";
import { Header } from "./components/Header.js";
import { useConnection } from "./hooks/useConnection.js";
import { useExpenses } from "./hooks/useExpenses.js";
import type { LocalExpense } from "./lib/idb.js";
import { removeExpense, restoreExpense } from "./lib/store.js";

const UNDO_MS = 6000;

export function App() {
  const status = useConnection();
  const { items, pendingCount } = useExpenses();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<LocalExpense | null>(null);

  const editing = items.find((e) => e.id === editingId) ?? null;

  // Автоскрытие undo-тоста.
  useEffect(() => {
    if (!deleted) return;
    const id = window.setTimeout(() => setDeleted(null), UNDO_MS);
    return () => window.clearTimeout(id);
  }, [deleted]);

  function handleDelete(item: LocalExpense) {
    if (editingId === item.id) setEditingId(null);
    void removeExpense(item.id);
    setDeleted(item);
  }

  function handleUndo() {
    if (deleted) void restoreExpense(deleted);
    setDeleted(null);
  }

  return (
    <div className="app">
      <Header status={status} pendingCount={pendingCount} />
      <main className={`app__grid ${items.length === 0 ? "app__grid--equal" : ""}`}>
        <ExpenseForm editing={editing} onDone={() => setEditingId(null)} />
        <ExpenseList
          items={items}
          editingId={editingId}
          onEdit={(item) => setEditingId(item.id)}
          onDelete={handleDelete}
        />
      </main>
      <footer className="app__footer">
        Данные сохраняются локально и синхронизируются с сервером автоматически при подключении.
      </footer>

      {deleted && (
        <div className="toast" role="status">
          <span>«{deleted.name}» удалён </span>
          <button className="toast__btn" type="button" onClick={handleUndo}>
            Отменить
          </button>
        </div>
      )}
    </div>
  );
}
