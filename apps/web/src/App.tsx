import { ExpenseForm } from "./components/ExpenseForm.js";
import { ExpenseList } from "./components/ExpenseList.js";
import { Header } from "./components/Header.js";
import { useConnection } from "./hooks/useConnection.js";
import { useExpenses } from "./hooks/useExpenses.js";

export function App() {
  const status = useConnection();
  const { items, total, pendingCount } = useExpenses();

  return (
    <div className="app">
      <Header status={status} pendingCount={pendingCount} />
      <main className="app__grid">
        <ExpenseForm />
        <ExpenseList items={items} total={total} />
      </main>
      <footer className="app__footer">
        Данные сохраняются локально и синхронизируются с сервером автоматически при подключении.
      </footer>
    </div>
  );
}
