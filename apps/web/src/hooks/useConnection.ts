import { useEffect, useRef, useState } from "react";
import { pingHealth } from "../lib/api.js";
import { requestSync } from "../lib/store.js";

export type ConnectionStatus = "online" | "offline" | "backend-down";

const HEALTH_INTERVAL_MS = 5000;

/**
 * Живой статус подключения к сети И к бэкенду.
 *  - offline      — браузер без сети;
 *  - backend-down — сеть есть, но /health не отвечает;
 *  - online       — сеть есть и бэкенд жив.
 * При переходе в online автоматически запускает синхронизацию очереди.
 */
export function useConnection(): ConnectionStatus {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [backendOk, setBackendOk] = useState(false);
  const prevStatus = useRef<ConnectionStatus>("offline");

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function check() {
      if (!navigator.onLine) {
        if (!cancelled) setBackendOk(false);
        return;
      }
      const ok = await pingHealth(controller.signal);
      if (!cancelled) setBackendOk(ok);
    }

    void check();
    const id = window.setInterval(check, HEALTH_INTERVAL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(id);
    };
  }, []);

  const status: ConnectionStatus = !online ? "offline" : backendOk ? "online" : "backend-down";

  // Перешли в online — догоняем синхронизацию очереди.
  useEffect(() => {
    if (status === "online" && prevStatus.current !== "online") {
      void requestSync();
    }
    prevStatus.current = status;
  }, [status]);

  return status;
}
