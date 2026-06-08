import type { ExpenseFormValues } from "@expense/shared";
import {
  type LocalExpense,
  deleteExpenseLocal,
  enqueueOp,
  getAllExpenses,
  putExpense,
  removeOpsForExpense,
} from "./idb.js";
import { syncNow } from "./sync.js";

/**
 * Реактивный стор поверх IndexedDB. Снимок (snapshot) кэшируется в памяти и
 * раздаётся через useSyncExternalStore. Любая мутация: пишем локально → кладём
 * в outbox → перечитываем снимок → дёргаем фоновую синхронизацию.
 */

let snapshot: LocalExpense[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function sortExpenses(items: LocalExpense[]): LocalExpense[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/** Перечитывает снимок из IndexedDB и оповещает подписчиков */
export async function reload(): Promise<void> {
  snapshot = sortExpenses(await getAllExpenses());
  emit();
}

export const expenseStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): LocalExpense[] {
    return snapshot;
  },
};

/** Регистрирует Background Sync (если поддерживается) — догонит синк даже при закрытой вкладке. */
async function registerBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    // SyncManager есть не во всех браузерах — пробуем мягко.
    await (reg as unknown as { sync?: { register(tag: string): Promise<void> } }).sync?.register(
      "expense-sync",
    );
  } catch {
    /* не поддерживается — синхронизация всё равно произойдёт на reconnect */
  }
}

/** Запускает синхронизацию, если есть сеть; результат отражаем в UI. */
export async function requestSync(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    void registerBackgroundSync();
    return;
  }
  try {
    await syncNow();
    await reload();
  } catch {
    void registerBackgroundSync();
  }
}

/** Создание статьи: оптимистично пишем локально и ставим в очередь отправки. */
export async function addExpense(form: ExpenseFormValues): Promise<void> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const local: LocalExpense = {
    id,
    name: form.name,
    sum: form.sum,
    date: form.date,
    createdAt: now,
    updatedAt: now,
    pendingOp: "create",
  };

  await putExpense(local);
  await enqueueOp({
    opId: crypto.randomUUID(),
    type: "create",
    expenseId: id,
    payload: { id, name: form.name, sum: form.sum, date: form.date, createdAt: now },
    createdAt: now,
  });

  await reload();
  void requestSync();
}

/** Удаление статьи (оптимистично). */
export async function removeExpense(id: string): Promise<void> {
  const existing = snapshot.find((e) => e.id === id);

  if (existing?.pendingOp === "create") {
    // Запись ещё не доехала до сервера — просто отменяем её локально и в очереди.
    await removeOpsForExpense(id);
    await deleteExpenseLocal(id);
    await reload();
    return;
  }

  await deleteExpenseLocal(id);
  await enqueueOp({
    opId: crypto.randomUUID(),
    type: "delete",
    expenseId: id,
    createdAt: new Date().toISOString(),
  });

  await reload();
  void requestSync();
}
