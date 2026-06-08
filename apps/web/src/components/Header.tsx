import type { ConnectionStatus } from "../hooks/useConnection.js";
import { ConnectionBadge } from "./ConnectionBadge.js";

interface Props {
  status: ConnectionStatus;
  pendingCount: number;
}

export function Header({ status, pendingCount }: Props) {
  return (
    <header className="header">
      <div className="header__brand">
        <img
          className="header__logo"
          src="/logo.png"
          width={46}
          height={46}
          alt="Expense Tracker"
        />
        <h1 className="header__title">Трекер расходов</h1>
      </div>
      <ConnectionBadge status={status} pendingCount={pendingCount} />
    </header>
  );
}
