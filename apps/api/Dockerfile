# --- build: ставим зависимости и собираем (tsup инлайнит @expense/shared) ---
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @expense/api build
# Самодостаточный prod-срез пакета (package.json + prod node_modules + dist + drizzle)
RUN pnpm --filter @expense/api deploy --prod /app

# --- runner: только то, что нужно в рантайме ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .

EXPOSE 3001
CMD ["node", "dist/index.js"]
