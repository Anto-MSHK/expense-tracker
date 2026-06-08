import { sumExpenses } from "@expense/shared";
import { useEffect, useSyncExternalStore } from "react";
import type { LocalExpense } from "../lib/idb.js";
import { expenseStore, reload } from "../lib/store.js";

export interface UseExpensesResult {
  items: LocalExpense[];
  total: number;
  count: number;
  pendingCount: number;
}

/** Подписка на локальный стор расходов + производные значения (итог, кол-во в очереди). */
export function useExpenses(): UseExpensesResult {
  const items = useSyncExternalStore(expenseStore.subscribe, expenseStore.getSnapshot);

  // Первичная загрузка из IndexedDB при монтировании.
  useEffect(() => {
    void reload();
  }, []);

  return {
    items,
    total: sumExpenses(items),
    count: items.length,
    pendingCount: items.filter((e) => e.pendingOp).length,
  };
}
