import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";

const authFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".auth/user.json",
);

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test("authenticate", async ({ page }) => {
  test.skip(!email || !password, "E2E_EMAIL and E2E_PASSWORD are required");

  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
    timeout: 30_000,
  });
  await page.context().storageState({ path: authFile });
});
