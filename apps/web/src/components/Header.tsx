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
        <span className="header__logo" aria-hidden="true">
          ₽
        </span>
        <div>
          <h1 className="header__title">Трекер расходов</h1>
          <p className="header__subtitle">Offline-first PWA</p>
        </div>
      </div>
      <ConnectionBadge status={status} pendingCount={pendingCount} />
    </header>
  );
}
