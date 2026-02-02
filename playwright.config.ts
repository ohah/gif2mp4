import { defineConfig, devices } from '@playwright/test';

/**
 * e2e: GIF→MP4 변환 테스트.
 * WebCodecs VideoEncoder가 헤드리스 Chromium에서 동작하도록 Chromium 인자 사용.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    traceOnFirstRetry: true,
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome',
        launchOptions: {
          args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
          ],
        },
      },
    },
  ],
});
