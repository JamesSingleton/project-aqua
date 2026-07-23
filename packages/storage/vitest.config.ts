import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Pure validation only — Supabase client/upload modules need network mocks.
      include: ["src/validate.ts"],
      exclude: [
        "src/client.ts",
        "src/index.ts",
        "src/team-logo.ts",
        "src/user-avatar.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
