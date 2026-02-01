import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174';

test('GIF→MP4 변환 시 에러/성공 메시지 확인', async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(10000);

  const errEl = page.locator('[data-testid="error-message"]');
  const successEl = page.locator('text=MP4 다운로드');

  if (await successEl.isVisible()) {
    console.log('OK: 변환 성공. "MP4 다운로드" 표시됨.');
    return;
  }
  if (await errEl.isVisible()) {
    const text = await errEl.textContent();
    console.log('ERROR (화면):', text?.trim());
    console.log('\n--- 콘솔 로그 ---');
    consoleLogs.forEach((l) => console.log(l));
    expect(await successEl.isVisible(), `에러 발생: ${text?.trim()}`).toBeTruthy();
    return;
  }
  const bodyText = await page.locator('body').textContent();
  console.log('body 일부:', bodyText?.slice(0, 600));
  expect(await successEl.isVisible()).toBeTruthy();
});
