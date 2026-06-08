import { type CreateExpenseInput, type Expense, expenseSchema } from "@expense/shared";

/** База API: в dev — Vite-прокси /api, в prod можно задать VITE_API_URL. */
export const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export interface ExpensesResponse {
  items: Expense[];
  total: number;
  count: number;
}

/** Ошибка сети/сервера, по которой стоит повторить операцию позже */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    // fetch упал — сеть недоступна, операцию можно повторить
    throw new ApiError("Сеть недоступна", 0, true);
  }
  if (!res.ok) {
    // 5xx — временная проблема (повторяем), 4xx — данные невалидны (не повторяем)
    throw new ApiError(`HTTP ${res.status}`, res.status, res.status >= 500);
  }
  return res;
}

export async function fetchExpenses(): Promise<ExpensesResponse> {
  const res = await request("/expenses");
  return res.json();
}

export async function createExpenseRemote(input: CreateExpenseInput): Promise<Expense> {
  const res = await request("/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return expenseSchema.parse(await res.json());
}

export async function deleteExpenseRemote(id: string): Promise<void> {
  await request(`/expenses/${id}`, { method: "DELETE" });
}

/** Health-чек бэкенда (для индикатора подключения) */
export async function pingHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal });
    return res.ok;
  } catch {
    return false;
  }
}
