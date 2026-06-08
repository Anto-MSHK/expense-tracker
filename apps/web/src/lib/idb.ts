import type { CreateExpenseInput, Expense } from "@expense/shared";
import { type DBSchema, type IDBPDatabase, openDB } from "idb";

/**
 * Локальная запись = серверная запись + флаг незавершённой операции.
 * `pendingOp` отражает, что запись ещё не подтверждена бэкендом:
 *  - "create"  — создана офлайн, ждёт отправки;
 *  - "delete"  — помечена на удаление, ждёт отправки DELETE.
 */
export interface LocalExpense extends Expense {
  pendingOp?: "create" | "delete";
}

/** Операция в outbox-очереди (replay при восстановлении сети) */
export interface OutboxOp {
  opId: string;
  type: "create" | "delete";
  expenseId: string;
  /** payload нужен только для create */
  payload?: CreateExpenseInput;
  createdAt: string;
}

interface ExpenseDB extends DBSchema {
  expenses: {
    key: string;
    value: LocalExpense;
  };
  outbox: {
    key: string;
    value: OutboxOp;
    indexes: { "by-createdAt": string };
  };
}

const DB_NAME = "expense-tracker";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ExpenseDB>> | null = null;

/** Singleton-доступ к базе (работает и в окне, и в service worker) */
export function getDb(): Promise<IDBPDatabase<ExpenseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ExpenseDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("expenses", { keyPath: "id" });
        const outbox = db.createObjectStore("outbox", { keyPath: "opId" });
        outbox.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

// --- expenses ---

export async function getAllExpenses(): Promise<LocalExpense[]> {
  return (await getDb()).getAll("expenses");
}

export async function putExpense(expense: LocalExpense): Promise<void> {
  await (await getDb()).put("expenses", expense);
}

export async function deleteExpenseLocal(id: string): Promise<void> {
  await (await getDb()).delete("expenses", id);
}

// --- outbox ---

/** Операции в порядке их создания (replay сохраняет последовательность) */
export async function getOutboxOps(): Promise<OutboxOp[]> {
  return (await getDb()).getAllFromIndex("outbox", "by-createdAt");
}

export async function enqueueOp(op: OutboxOp): Promise<void> {
  await (await getDb()).put("outbox", op);
}

export async function removeOp(opId: string): Promise<void> {
  await (await getDb()).delete("outbox", opId);
}

/** Удаляет все операции, относящиеся к конкретной статье (например, при отмене create) */
export async function removeOpsForExpense(expenseId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("outbox", "readwrite");
  const ops = await tx.store.getAll();
  await Promise.all(ops.filter((op) => op.expenseId === expenseId).map((op) => tx.store.delete(op.opId)));
  await tx.done;
}
