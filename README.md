# Expense Tracker

Offline-first PWA для учёта расходов. TypeScript, React + Vite на фронте, Express + PostgreSQL на бэке. Статьи можно создавать и читать без сети — изменения сохраняются локально и уходят на сервер, когда связь возвращается.

[![CI](https://github.com/Anto-MSHK/expense-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Anto-MSHK/expense-tracker/actions/workflows/ci.yml)

Демо: https://expense-tracker-rho-gold-28.vercel.app

## Стек

- Фронт: React 18, Vite, vite-plugin-pwa (Workbox), idb, zod
- Бэк: Express, Drizzle ORM, postgres.js, zod
- БД: PostgreSQL 16
- Общее: TypeScript (strict), pnpm workspaces, Vitest, Playwright

## Запуск

Нужны Node ≥ 20, pnpm и Docker (для PostgreSQL).

```bash
pnpm install
cp .env.example .env
pnpm db:up          # PostgreSQL в Docker
pnpm db:migrate
pnpm dev            # фронт :5173, API :3001
```

Если порт 5432 занят — поменяйте `POSTGRES_PORT` и порт в `DATABASE_URL` в `.env`.

Прод-сборка:

```bash
pnpm build
pnpm --filter @expense/api start     # API из dist
pnpm --filter @expense/web preview   # статика + service worker
```

## Как работает синхронизация

IndexedDB — локальный источник правды для интерфейса. Любая мутация сначала пишется локально и кладётся в очередь (outbox), UI обновляется сразу. Если есть сеть — очередь сразу отправляется на сервер, иначе ждёт. Отправку запускает возврат связи: событие `online`, ожившая проверка `/health` или Background Sync (он догоняет синхронизацию даже при закрытой вкладке).

`id` статьи генерируется на клиенте, сервер делает по нему `upsert` — поэтому повторная отправка из очереди не создаёт дублей. Конфликты разрешаются как last-write-wins по `updated_at`. Операции, которые сервер не примет (ошибка валидации, 4xx), удаляются из очереди, чтобы не блокировать остальные.

Схемы валидации (zod) лежат в пакете `shared` и используются и фронтом, и бэком, так что правила не расходятся. Суммы считаются в копейках, чтобы не накапливать ошибки чисел с плавающей точкой.

Реализованы все пункты ТЗ; дополнительно — редактирование статей, undo при удалении, поиск и сортировка списка.

## API

Конфигурация через переменные окружения: `DATABASE_URL`, `API_PORT`, `CORS_ORIGIN`.

| Метод    | Путь            | Описание                                     |
|----------|-----------------|----------------------------------------------|
| `GET`    | `/health`       | Статус сервера и проверка БД                  |
| `GET`    | `/expenses`     | Список статей + итог (`{ items, total, count }`) |
| `POST`   | `/expenses`     | Создание/обновление (upsert по `id`)          |
| `DELETE` | `/expenses/:id` | Удаление (идемпотентно)                       |

Таблица `expenses`: `id` (uuid, PK), `name`, `sum` (`numeric(12,2)`), `date`, `created_at`, `updated_at`.

## Тесты

```bash
pnpm test                            # vitest, все пакеты
pnpm lint                            # biome
pnpm typecheck
pnpm --filter @expense/web test:e2e  # playwright, нужны запущенные API и БД
```

Покрыто: валидация (`shared`), роутинг и валидация API (supertest), движок синхронизации на `fake-indexeddb` (реплей очереди, обработка сетевых и 4xx-ошибок, сверка с сервером) и сквозной offline-сценарий на Playwright. CI прогоняет это на каждый push.

## Структура

```
packages/shared   zod-схемы, типы, money-хелперы (общие для фронта и бэка)
apps/api          Express + Drizzle: db/, routes/ (/expenses, /health), middleware/
apps/web          React + Vite + PWA: lib/ (idb, api, sync, store), hooks/, components/
docker-compose.yml  PostgreSQL
```

## Лицензия

MIT
