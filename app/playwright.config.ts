import { defineConfig } from '@playwright/test';

const DEFAULT_BASE_URL = 'http://localhost:8000';

export default defineConfig({
  testDir: './tests',
  testMatch: 'smoke.spec.ts',
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? DEFAULT_BASE_URL,
    channel: process.env.SMOKE_BROWSER_CHANNEL ?? 'chrome',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    extraHTTPHeaders: process.env.SMOKE_BEARER_TOKEN
      ? { Authorization: `Bearer ${process.env.SMOKE_BEARER_TOKEN}` }
      : undefined,
  },
});
