import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.{test,spec}.ts"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Pure leftovers in admin (domain helpers live in swim-core).
      include: ["lib/**/*.ts", "schemas/**/*.ts"],
      exclude: [
        // RSC/UI/server actions are covered by Playwright, not Vitest.
        "app/**",
        "components/**",
        "hooks/**",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
