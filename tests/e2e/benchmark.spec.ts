import { test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5174';

test.setTimeout(120000);

test('벤치마크 실행 후 결과 출력', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page
    .locator('[data-testid="benchmark-button"]')
    .waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('[data-testid="benchmark-button"]').click();
  await page
    .locator('[data-testid="benchmark-result"]')
    .waitFor({ state: 'visible', timeout: 90000 });

  const result = page.locator('[data-testid="benchmark-result"]');
  const table = await result.locator('table').textContent();
  const summary = await result.locator('p').last().textContent();
  console.log('\n=== 벤치마크 결과 ===\n');
  console.log(table ?? '');
  console.log(summary ?? '');
});
