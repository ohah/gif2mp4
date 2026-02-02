import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174';
const RUN_FFPROBE = process.env.RUN_FFPROBE === '1';

test('GIF→MP4 변환 시 에러/성공 메시지 확인', async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(10000);

  const errEl = page.locator('[data-testid="error-message"]');
  const successEl = page.locator('text=MP4 다운로드');
  const videoErrEl = page.locator('[data-testid="video-error"]');

  if (await successEl.isVisible()) {
    if (await videoErrEl.isVisible()) {
      const videoErr = await videoErrEl.textContent();
      if (RUN_FFPROBE) {
        try {
          execSync('ffprobe -version', { encoding: 'utf-8', stdio: 'pipe' });
          const src = await page.locator('video').getAttribute('src');
          if (src) {
            const buf = await page.evaluate(async (url) => {
              const r = await fetch(url);
              return Array.from(new Uint8Array(await r.arrayBuffer()));
            }, src);
            const outPath = join(process.cwd(), 'test-out.mp4');
            writeFileSync(outPath, new Uint8Array(buf));
            execSync(`ffprobe -v error -show_format -show_streams "${outPath}"`, {
              encoding: 'utf-8',
            });
          }
        } catch (e: unknown) {
          const err = e as { stderr?: string; message?: string };
          if (err?.stderr) console.log('ffprobe:', err.stderr);
        }
      }
      console.log('ERROR (비디오 로드):', videoErr?.trim());
      console.log('\n--- 콘솔 로그 ---');
      consoleLogs.forEach((l) => console.log(l));
      expect(await videoErrEl.isVisible(), `비디오 재생 실패: ${videoErr?.trim()}`).toBeFalsy();
    }
    const readyState = await page
      .locator('video')
      .evaluate((el) => (el as HTMLVideoElement).readyState);
    expect(
      readyState,
      '비디오가 현재/충분 데이터를 가져와 재생 가능해야 함'
    ).toBeGreaterThanOrEqual(2);
    console.log('OK: 변환 성공, MP4 재생 가능.');
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
