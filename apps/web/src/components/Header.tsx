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
        <div>
          <h1 className="header__title">Трекер расходов</h1>
          <p className="header__subtitle">Offline-first PWA</p>
        </div>
      </div>
      <ConnectionBadge status={status} pendingCount={pendingCount} />
    </header>
  );
}
