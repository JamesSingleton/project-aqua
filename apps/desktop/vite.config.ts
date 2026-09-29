import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;
const uiSrc = fileURLToPath(new URL("../../packages/ui/src/", import.meta.url));

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // @lane4hq/ui components import each other through the package name.
    alias: [
      {
        find: /^@lane4hq\/ui\/(components|lib|hooks)\/(.*)$/,
        replacement: `${uiSrc}$1/$2`,
      },
    ],
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // WebView2 (Chromium) on Windows, WKWebView (Safari 15+) on macOS.
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari15",
    minify: !process.env.TAURI_ENV_DEBUG,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // Loaded from disk by the webview, not over the network; xlsx dominates.
    chunkSizeWarningLimit: 1500,
  },
});
