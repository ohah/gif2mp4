/**
 * Playwright로 앱 접속 후 에러/성공 메시지 확인.
 * 사용: bun run check-app (preview 서버 4174 실행 중이어야 함)
 */
import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174';
const TOTAL_TIMEOUT_MS = 18000;

async function main() {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const timeoutId = setTimeout(() => {
    console.error('TIMEOUT: 스크립트가', TOTAL_TIMEOUT_MS / 1000, '초 내에 완료되지 않았습니다.');
    if (browser)
      browser
        .close()
        .catch(() => {})
        .finally(() => process.exit(2));
    else process.exit(2);
  }, TOTAL_TIMEOUT_MS);

  browser = await chromium.launch({ headless: true, timeout: 8000 });
  const context = await browser.newContext();
  const consoleLogs: string[] = [];
  context.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push(`[${type}] ${text}`);
  });

  const page = await context.newPage();
  let errorText: string | null = null;
  let success = false;

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(4000);

    const errEl = page.locator('[data-testid="error-message"]');
    const successEl = page.locator('text=MP4 다운로드');

    if (await successEl.isVisible()) {
      success = true;
      console.log('OK: 변환 성공. "MP4 다운로드" 표시됨.');
    } else if (await errEl.isVisible()) {
      errorText = await errEl.textContent();
      console.log('ERROR (화면):', errorText?.trim() ?? '(empty)');
    } else {
      const bodyText = await page.locator('body').textContent();
      console.log('ERROR: 에러/성공 요소 없음. body 일부:', bodyText?.slice(0, 600));
    }
  } catch (e) {
    console.error('페이지 로드/대기 실패:', e);
  }

  if (consoleLogs.length) {
    console.log('\n--- 콘솔 로그 ---');
    consoleLogs.forEach((l) => console.log(l));
  }

  clearTimeout(timeoutId);
  await browser.close();
  process.exit(success ? 0 : 1);
}

main();
