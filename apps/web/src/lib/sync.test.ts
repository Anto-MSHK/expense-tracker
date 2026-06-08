import "fake-indexeddb/auto";
import type { Expense } from "@expense/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Мокаем сетевой слой — тестируем именно логику offline-синхронизации.
vi.mock("./api.js", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      msg: string,
      public status: number,
      public retryable: boolean,
    ) {
      super(msg);
    }
  },
  createExpenseRemote: vi.fn(),
  deleteExpenseRemote: vi.fn(),
  fetchExpenses: vi.fn(),
}));

import { createExpenseRemote, fetchExpenses } from "./api.js";
import { enqueueOp, getAllExpenses, getOutboxOps, putExpense } from "./idb.js";
import { pullFromServer, replayOutbox } from "./sync.js";

const sample: Expense = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Кофе",
  sum: 4.5,
  date: "2026-06-08",
  createdAt: "2026-06-08T10:00:00.000Z",
  updatedAt: "2026-06-08T10:00:00.000Z",
};

beforeEach(async () => {
  // Чистим базу между тестами.
  const { getDb } = await import("./idb.js");
  const db = await getDb();
  await db.clear("expenses");
  await db.clear("outbox");
  vi.clearAllMocks();
});

afterEach(() => vi.clearAllMocks());

describe("replayOutbox", () => {
  it("отправляет create-операцию и снимает флаг pending", async () => {
    vi.mocked(createExpenseRemote).mockResolvedValue(sample);

    await putExpense({ ...sample, pendingOp: "create" });
    await enqueueOp({
      opId: "op-1",
      type: "create",
      expenseId: sample.id,
      payload: {
        id: sample.id,
        name: sample.name,
        sum: sample.sum,
        date: sample.date,
        createdAt: sample.createdAt,
      },
      createdAt: sample.createdAt,
    });

    const result = await replayOutbox();

    expect(result.flushed).toBe(1);
    expect(result.remaining).toBe(0);
    expect(await getOutboxOps()).toHaveLength(0);
    const [stored] = await getAllExpenses();
    expect(stored?.pendingOp).toBeUndefined();
  });

  it("останавливается на сетевой ошибке и сохраняет операцию для повтора", async () => {
    const { ApiError } = await import("./api.js");
    vi.mocked(createExpenseRemote).mockRejectedValue(new ApiError("offline", 0, true));

    await putExpense({ ...sample, pendingOp: "create" });
    await enqueueOp({
      opId: "op-1",
      type: "create",
      expenseId: sample.id,
      payload: {
        id: sample.id,
        name: sample.name,
        sum: sample.sum,
        date: sample.date,
        createdAt: sample.createdAt,
      },
      createdAt: sample.createdAt,
    });

    const result = await replayOutbox();

    expect(result.flushed).toBe(0);
    expect(result.remaining).toBe(1); // операция осталась в очереди
  });

  it("отбрасывает невалидную (4xx) операцию, не блокируя очередь", async () => {
    const { ApiError } = await import("./api.js");
    vi.mocked(createExpenseRemote).mockRejectedValue(new ApiError("bad", 400, false));

    await putExpense({ ...sample, pendingOp: "create" });
    await enqueueOp({
      opId: "op-1",
      type: "create",
      expenseId: sample.id,
      payload: {
        id: sample.id,
        name: sample.name,
        sum: sample.sum,
        date: sample.date,
        createdAt: sample.createdAt,
      },
      createdAt: sample.createdAt,
    });

    const result = await replayOutbox();

    expect(result.remaining).toBe(0);
    expect(await getAllExpenses()).toHaveLength(0); // «отравленная» запись убрана
  });
});

describe("pullFromServer", () => {
  it("удаляет локальные синхронизированные записи, исчезнувшие на сервере", async () => {
    vi.mocked(fetchExpenses).mockResolvedValue({ items: [], total: 0, count: 0 });
    await putExpense({ ...sample }); // synced, без pendingOp

    await pullFromServer();

    expect(await getAllExpenses()).toHaveLength(0);
  });

  it("не трогает записи с незавершённой операцией в очереди", async () => {
    vi.mocked(fetchExpenses).mockResolvedValue({ items: [], total: 0, count: 0 });
    await putExpense({ ...sample, pendingOp: "create" });
    await enqueueOp({
      opId: "op-1",
      type: "create",
      expenseId: sample.id,
      payload: {
        id: sample.id,
        name: sample.name,
        sum: sample.sum,
        date: sample.date,
        createdAt: sample.createdAt,
      },
      createdAt: sample.createdAt,
    });

    await pullFromServer();

    expect(await getAllExpenses()).toHaveLength(1); // локальное изменение сохранено
  });

  it("подтягивает новые записи с сервера", async () => {
    vi.mocked(fetchExpenses).mockResolvedValue({ items: [sample], total: 4.5, count: 1 });

    await pullFromServer();

    const [stored] = await getAllExpenses();
    expect(stored?.id).toBe(sample.id);
    expect(stored?.pendingOp).toBeUndefined();
  });
});
