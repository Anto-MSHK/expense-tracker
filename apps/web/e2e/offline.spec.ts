import { expect, test } from "@playwright/test";

/**
 * Сквозной сценарий offline-first — ровно та проверка, что делается руками:
 * online-создание → потеря сети → offline-создание в очередь → возврат сети → автосинк.
 */
test("offline-first: создание онлайн, офлайн и автосинхронизация", async ({ page, context }) => {
  await page.goto("/");

  // 1. Онлайн
  await expect(page.getByText("Онлайн")).toBeVisible({ timeout: 10_000 });

  // 2. Создаём статью онлайн — появляется и синхронизируется (очередь пуста)
  const onlineName = `E2E-online-${Date.now()}`;
  await page.getByLabel("Название статьи").fill(onlineName);
  await page.getByLabel("Сумма, ₽").fill("100");
  await page.getByRole("button", { name: "Добавить расход" }).click();
  await expect(page.getByText(onlineName)).toBeVisible();
  // ждём, пока статья доедет до сервера — все «не синхр.» исчезнут
  await expect(page.getByText("не синхр.")).toHaveCount(0, { timeout: 10_000 });

  // 3. Теряем сеть → статус «Офлайн»
  await context.setOffline(true);
  await expect(page.getByText("Офлайн")).toBeVisible({ timeout: 10_000 });

  // 4. Создаём статью офлайн — ровно одна в очереди, помечена «не синхр.»
  const offlineName = `E2E-offline-${Date.now()}`;
  await page.getByLabel("Название статьи").fill(offlineName);
  await page.getByLabel("Сумма, ₽").fill("50");
  await page.getByRole("button", { name: "Добавить расход" }).click();
  await expect(page.getByText(offlineName)).toBeVisible();
  await expect(page.getByText("не синхр.")).toHaveCount(1, { timeout: 5_000 });
  await expect(page.getByText(/в очереди/)).toBeVisible();

  // 5. Возвращаем сеть → автосинхронизация очищает очередь
  await context.setOffline(false);
  await expect(page.getByText("Онлайн")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("не синхр.")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText(/в очереди/)).toHaveCount(0);
});
