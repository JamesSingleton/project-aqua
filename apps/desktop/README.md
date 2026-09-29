# Lane4 Desktop (`@lane4hq/desktop`)

Local-first desktop app for macOS and Windows, built with [Tauri v2](https://tauri.app) (Rust core + system webview) and a Vite/React UI that uses the shared `@lane4hq/ui` design system.

Today it opens and inspects local meet files (SD3/SDIF, HY3, CL2, EV3, HYV, XLS, ZIP) with `@lane4hq/swim-formats`, fully offline. See [`docs/specs/desktop-roadmap.md`](../../docs/specs/desktop-roadmap.md) for where it is headed.

## Prerequisites

Everyone needs Node 24+ and pnpm (see the root `package.json`), plus the Rust toolchain:

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# new shell, or:
source ~/.cargo/env
cargo --version
```

### macOS

- Xcode Command Line Tools: `xcode-select --install` (confirm with `xcode-select -p`).
- For universal (Apple Silicon + Intel) release builds: `rustup target add aarch64-apple-darwin x86_64-apple-darwin`.

### Windows

- Rust via [rustup-init.exe](https://rustup.rs) with the default **MSVC** toolchain.
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload.
- [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/). It ships with Windows 10 (recent updates) and 11. The installer downloads the bootstrapper on machines that lack it.

## Scripts

Run from the repo root:

| Command | What it does |
|---|---|
| `pnpm dev:desktop` | Launch the Tauri app with hot reload (`tauri dev`) |
| `pnpm --filter @lane4hq/desktop dev:web` | UI only, in a browser at http://localhost:1420 (native file APIs unavailable) |
| `pnpm bundle:desktop` | Release installer for the current OS (`tauri build`) |
| `pnpm --filter @lane4hq/desktop build` | Web assets only (`dist/`). This is what root `pnpm build` / Turbo runs, so it never needs Rust |
| `pnpm --filter @lane4hq/desktop test` | Vitest (TS) |
| `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` | Rust unit tests |
| `pnpm --filter @lane4hq/desktop check:types` | TypeScript |

Bundles land in `src-tauri/target/release/bundle/`: `.app`/`.dmg` on macOS, and `.msi`/NSIS `.exe` on Windows. For a universal macOS build, run `pnpm --filter @lane4hq/desktop bundle --target universal-apple-darwin`.

## Layout

- `src/`: React UI (webview). Domain logic comes from workspace packages, not this app.
- `src-tauri/`: Rust core, `tauri.conf.json`, and `capabilities/` (least-privilege permissions).

## Security notes

- A strict CSP is set in `tauri.conf.json`. No remote scripts are allowed.
- File access goes through the dialog and fs plugins. Reads are only allowed for paths the user picks or drops (plus the fs scope in `capabilities/default.json`).
- Handle paths with Tauri APIs; never hand-join path strings, because Windows uses `\`.

## Releases

CI (`.github/workflows/desktop.yml`) builds unsigned macOS and Windows bundles on PRs. Code signing (Apple Developer ID + notarization, Windows Authenticode) and auto-update are planned in [`docs/specs/desktop-companion-v1.spec.md`](../../docs/specs/desktop-companion-v1.spec.md).
