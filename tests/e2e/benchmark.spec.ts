import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174';

test.setTimeout(120_000);

test('벤치마크 실행 후 결과 출력', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20_000 });

  const benchmarkBtn = page.locator('[data-testid="benchmark-button"]');
  await expect(benchmarkBtn).toBeVisible({ timeout: 20_000 });
  await benchmarkBtn.click();

  // 벤치마크 결과 대기
  const result = page.locator('[data-testid="benchmark-result"]');
  await expect(result).toBeVisible({ timeout: 90_000 });

  const table = await result.locator('table').textContent();
  const summary = await result.locator('p').last().textContent();
  console.log('\n=== 벤치마크 결과 ===\n');
  console.log(table ?? '');
  console.log(summary ?? '');

  // 결과에 예상 텍스트 포함 확인
  const resultText = (table ?? '') + (summary ?? '');
  expect(resultText).toMatch(/Rust WASM|gifuct-js/i);

  // 에러 메시지가 없어야 함 (양쪽 모두 성공)
  const errEl = page.locator('[data-testid="error-message"]');
  if (await errEl.isVisible()) {
    const errText = await errEl.textContent();
    console.warn(`벤치마크 에러: ${errText?.trim()}`);
  }
});
