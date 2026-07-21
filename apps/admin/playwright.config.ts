import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
const hasE2EAuth = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.CI
      ? "pnpm exec next build && pnpm exec next start -p 3001 -H localhost"
      : "pnpm exec next dev -p 3001 -H localhost",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: hasE2EAuth
    ? [
        { name: "setup", testMatch: /auth\.setup\.ts/ },
        {
          name: "chromium",
          use: {
            ...devices["Desktop Chrome"],
            storageState: "e2e/.auth/user.json",
          },
          testIgnore: /auth\.setup\.ts/,
          dependencies: ["setup"],
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
          testIgnore: [/auth\.setup\.ts/, /app\.auth\.spec\.ts/],
        },
      ],
});
