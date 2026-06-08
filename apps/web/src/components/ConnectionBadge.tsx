import type { ConnectionStatus } from "../hooks/useConnection.js";

const LABELS: Record<ConnectionStatus, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  "backend-down": "Сервер недоступен",
};

interface Props {
  status: ConnectionStatus;
  pendingCount: number;
}

/** Живой индикатор подключения к сети/бэкенду + счётчик несинхронизированных статей. */
export function ConnectionBadge({ status, pendingCount }: Props) {
  return (
    <div className={`badge badge--${status}`} role="status" aria-live="polite">
      <span className="badge__label">{LABELS[status]}</span>
      {pendingCount > 0 && (
        <span className="badge__pending" title="Ожидают синхронизации с сервером">
          {pendingCount} в очереди
        </span>
      )}
    </div>
  );
}
