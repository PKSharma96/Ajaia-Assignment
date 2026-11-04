import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against a running app (frontend + backend + seeded database).
 * Locally:   npm run dev (in both repos), then npm run test:e2e
 * Deployed:  E2E_BASE_URL=https://your-app.vercel.app npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    // Uses the installed Google Chrome. Set E2E_BROWSER_CHANNEL="" to use Playwright's bundled Chromium.
    channel: process.env.E2E_BROWSER_CHANNEL ?? "chrome",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
});
