import { ApiError, createExpenseRemote, deleteExpenseRemote, fetchExpenses } from "./api.js";
import {
  type OutboxOp,
  deleteExpenseLocal,
  getAllExpenses,
  getOutboxOps,
  putExpense,
  removeOp,
} from "./idb.js";

/**
 * Движок синхронизации (используется и в окне, и в service worker).
 *
 * Модель: IndexedDB — локальный источник правды для UI. Все изменения сначала
 * пишутся локально и кладутся в outbox-очередь, затем реплеятся на сервер.
 * Сервер — авторитет для уже синхронизированных записей (last-write-wins).
 */

/** Реплеит очередь операций на бэкенд. Останавливается на первой сетевой ошибке. */
export async function replayOutbox(): Promise<{ flushed: number; remaining: number }> {
  const ops = await getOutboxOps();
  let flushed = 0;

  for (const op of ops) {
    try {
      await applyOp(op);
      await removeOp(op.opId);
      flushed += 1;
    } catch (err) {
      if (err instanceof ApiError && !err.retryable) {
        // 4xx: данные не примут никогда — выбрасываем «отравленную» операцию,
        // чтобы она не блокировала очередь. Локальную запись тоже убираем.
        await removeOp(op.opId);
        if (op.type === "create") await deleteExpenseLocal(op.expenseId);
        console.warn("Отброшена невалидная операция из очереди:", op, err);
        flushed += 1;
        continue;
      }
      // Сетевая/временная ошибка — прекращаем, повторим позже.
      break;
    }
  }

  const remaining = (await getOutboxOps()).length;
  return { flushed, remaining };
}

async function applyOp(op: OutboxOp): Promise<void> {
  if (op.type === "create") {
    if (!op.payload) throw new ApiError("Операция create без payload", 400, false);
    const saved = await createExpenseRemote(op.payload);
    // Подтверждено сервером — снимаем флаг pending.
    await putExpense({ ...saved });
  } else {
    await deleteExpenseRemote(op.expenseId);
  }
}

/**
 * Подтягивает актуальное состояние с сервера и сливает с локальным.
 * Записи с незавершёнными операциями (в outbox) остаются нетронутыми —
 * локальные изменения важнее, пока не отправлены.
 */
export async function pullFromServer(): Promise<void> {
  const { items } = await fetchExpenses();
  const ops = await getOutboxOps();
  const pendingDeleteIds = new Set(ops.filter((o) => o.type === "delete").map((o) => o.expenseId));
  const pendingCreateIds = new Set(ops.filter((o) => o.type === "create").map((o) => o.expenseId));

  const serverById = new Map(items.map((item) => [item.id, item]));

  // Сервер → локально (для записей без незавершённых операций).
  for (const item of items) {
    if (pendingDeleteIds.has(item.id) || pendingCreateIds.has(item.id)) continue;
    await putExpense({ ...item });
  }

  // Локальные синхронизированные записи, исчезнувшие на сервере, — удаляем.
  const local = await getAllExpenses();
  for (const row of local) {
    if (row.pendingOp) continue; // не трогаем незакоммиченное
    if (!serverById.has(row.id)) await deleteExpenseLocal(row.id);
  }
}

/** Полный цикл: реплей очереди + подтягивание состояния. */
export async function syncNow(): Promise<void> {
  const { remaining } = await replayOutbox();
  // Подтягиваем актуальные данные, только если очередь полностью разошлась
  // (иначе можем затереть локальные изменения, которые ещё не доехали).
  if (remaining === 0) {
    await pullFromServer();
  }
}
