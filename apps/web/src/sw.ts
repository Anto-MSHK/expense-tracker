/// <reference lib="webworker" />
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { replayOutbox } from "./lib/sync.js";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Прекеш оболочки приложения (manifest подставляет vite-plugin-pwa).
precacheAndRoute(self.__WB_MANIFEST);

// Любая навигация офлайн → отдаём закешированный index.html (app shell).
// В dev-режиме index.html ещё не в прекеше — мягко пропускаем.
try {
  registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));
} catch {
  /* нет прекешированного app shell (dev) — навигационный fallback не нужен */
}

// autoUpdate + injectManifest: новый SW должен активироваться сразу,
// иначе пользователь видит старую версию до следующего полного перезапуска.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

/** Сообщает открытым вкладкам, что синхронизация завершилась — они перечитают данные. */
async function notifyClients() {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) client.postMessage({ type: "synced" });
}

// Background Sync: ОС разбудит SW при восстановлении сети и проиграет очередь —
// даже если вкладка закрыта.
self.addEventListener("sync", (event: Event) => {
  const syncEvent = event as Event & { tag: string; waitUntil(p: Promise<unknown>): void };
  if (syncEvent.tag === "expense-sync") {
    syncEvent.waitUntil(replayOutbox().then(notifyClients));
  }
});

// Явный пинок на синхронизацию из вкладки.
self.addEventListener("message", (event) => {
  if ((event.data as { type?: string } | null)?.type === "sync-now") {
    event.waitUntil?.(replayOutbox().then(notifyClients));
  }
});
