# --- build: собираем статику Vite + service worker ---
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @expense/web build

# --- runner: nginx раздаёт статику и проксирует /api на бэкенд ---
FROM nginx:alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 80
