import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { reload } from "./lib/store.js";
import "./styles/app.css";

// Service worker сообщает о завершении фоновой синхронизации — перечитываем стор.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if ((event.data as { type?: string } | null)?.type === "synced") {
      void reload();
    }
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("Не найден #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
