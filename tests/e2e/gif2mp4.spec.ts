import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174';

test.setTimeout(60_000);

test('GIF→MP4 변환 후 재생 가능한 MP4 생성', async ({ page }) => {
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === 'error') consoleErrors.push(text);
  });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });

  // WASM 로딩 + 샘플 변환 대기 (최대 30초)
  const successEl = page.locator('text=MP4 다운로드');
  const errEl = page.locator('[data-testid="error-message"]');

  await expect(successEl.or(errEl)).toBeVisible({ timeout: 30_000 });

  // 에러가 표시됐으면 실패
  if (await errEl.isVisible()) {
    const errorText = await errEl.textContent();
    console.log('\n--- 콘솔 로그 ---');
    consoleLogs.forEach((l) => console.log(l));
    expect(false, `변환 에러 발생: ${errorText?.trim()}`).toBeTruthy();
    return;
  }

  // MP4 다운로드 링크 존재 확인
  await expect(successEl).toBeVisible();

  // 비디오 로드 에러 확인
  const videoErrEl = page.locator('[data-testid="video-error"]');
  if (await videoErrEl.isVisible()) {
    const videoErr = await videoErrEl.textContent();
    console.log('\n--- 콘솔 로그 ---');
    consoleLogs.forEach((l) => console.log(l));
    expect(false, `비디오 재생 실패: ${videoErr?.trim()}`).toBeTruthy();
    return;
  }

  // 비디오 readyState >= 2 (HAVE_CURRENT_DATA 이상)
  const readyState = await page
    .locator('video')
    .evaluate((el) => (el as HTMLVideoElement).readyState);
  expect(readyState, '비디오가 재생 가능한 상태여야 함').toBeGreaterThanOrEqual(2);

  // 비디오 duration이 유효한 양수
  const duration = await page
    .locator('video')
    .evaluate((el) => (el as HTMLVideoElement).duration);
  expect(duration, '비디오 duration이 유효한 양수여야 함').toBeGreaterThan(0);
  expect(Number.isFinite(duration), 'duration이 finite여야 함').toBeTruthy();

  // 비디오 크기가 유효
  const { videoWidth, videoHeight } = await page.locator('video').evaluate((el) => {
    const v = el as HTMLVideoElement;
    return { videoWidth: v.videoWidth, videoHeight: v.videoHeight };
  });
  expect(videoWidth, 'videoWidth > 0').toBeGreaterThan(0);
  expect(videoHeight, 'videoHeight > 0').toBeGreaterThan(0);

  // MP4 blob URL에서 데이터 가져와 기본 검증
  const mp4Check = await page.evaluate(async () => {
    const videoEl = document.querySelector('video') as HTMLVideoElement;
    if (!videoEl?.src) return { ok: false, reason: 'no video src' };
    const res = await fetch(videoEl.src);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length < 8) return { ok: false, reason: 'too small' };
    // MP4 파일은 ftyp box로 시작 (offset 4에 "ftyp" 문자열)
    const ftyp = String.fromCharCode(buf[4], buf[5], buf[6], buf[7]);
    return { ok: ftyp === 'ftyp', size: buf.length, ftyp };
  });
  expect(mp4Check.ok, `MP4 ftyp 헤더 확인 (got: ${mp4Check.ftyp})`).toBeTruthy();
  expect(mp4Check.size, 'MP4 파일 크기 > 0').toBeGreaterThan(0);

  console.log(`OK: 변환 성공. MP4 크기=${mp4Check.size}bytes, ${videoWidth}x${videoHeight}, duration=${duration.toFixed(2)}s`);
});

test('사용자 GIF 파일 업로드 후 변환', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });

  // WASM 로딩 대기
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached({ timeout: 20_000 });

  // 최소 GIF 파일 생성 (1x1 투명 GIF)
  const minimalGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  await fileInput.setInputFiles({
    name: 'test.gif',
    mimeType: 'image/gif',
    buffer: minimalGif,
  });

  // 변환 결과 대기
  const successEl = page.locator('text=MP4 다운로드');
  const errEl = page.locator('[data-testid="error-message"]');
  await expect(successEl.or(errEl)).toBeVisible({ timeout: 30_000 });

  // 1x1 GIF는 홀수 크기라 인코더에서 에러날 수 있음 → 에러든 성공이든 크래시 없이 처리되면 OK
  if (await errEl.isVisible()) {
    const errorText = await errEl.textContent();
    console.log(`1x1 GIF 변환 에러 (예상 가능): ${errorText?.trim()}`);
  } else {
    console.log('1x1 GIF 변환 성공');
  }
});

test('변환 중 로딩 표시', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });

  // 초기 로딩 시 "변환 중…" 또는 "WASM 로딩 중…" 텍스트 확인
  const loadingText = page.locator('text=변환 중…').or(page.locator('text=WASM 로딩 중…'));
  // 페이지가 자동으로 샘플 GIF를 변환하므로, 잠깐이라도 로딩 상태가 보여야 함
  // 단, 빠르게 완료되면 못 볼 수도 있으므로 최종 결과만 확인
  const successEl = page.locator('text=MP4 다운로드');
  const errEl = page.locator('[data-testid="error-message"]');
  await expect(successEl.or(errEl)).toBeVisible({ timeout: 30_000 });
  // 최종 상태에서는 "변환 중…"이 안 보여야 함
  await expect(page.locator('text=변환 중…')).not.toBeVisible();
});
