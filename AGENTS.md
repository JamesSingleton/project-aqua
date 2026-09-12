# Project Aqua — Agent conventions

Short rules for AI agents working in this monorepo. Prefer existing packages and patterns over inventing new ones.

## Models

When spawning subagents or choosing a model for work in this repo, **only** use:

- **Composer 2.5** (`composer-2.5` / `composer-2.5-fast`)
- **Cursor Grok 4.5** (`cursor-grok-4.5-high`)

Do not use other model families (Claude, GPT, GLM, etc.) unless the human explicitly overrides this rule in the current message.

## Product posture

- **Admin (`apps/admin`)** is a **visiting-team** coach SaaS: roster, entries, results, workouts, calendar for meets your team attends.
- **Out of scope for now:** host meet merge (other clubs’ entry packs), family/parent portal, dues/messaging, timing console / MMDB.
- **Future (do not build unless asked):** host entry merge → desktop Meet Manager companion → public marketing roadmap on `apps/web`.

## Swim file formats

- **Runtime parsers/exporters:** `@project-aqua/swim-formats` (TypeScript). Import from package subpaths (e.g. `@project-aqua/swim-formats/hy3`), not ad-hoc parsers.
- **Oracle only:** the external Python [`hytek-parser`](https://github.com/SwimComm/hytek-parser) package is a **parity reference** for HY3/HYV — not a production sidecar.
- Supported interchange: HY3, CL2, EV3, HYV, SDIF/SD3, XLS (MM event reports), ZIP packs.
- Fixtures live in `packages/swim-formats/fixtures/` (PII-safe mirrors of real TM/MM packs). Do not commit raw coach dumps outside that discipline.
- **Do not invent new format parsers without golden / Vitest coverage** against those fixtures.

## Testing

- Format work is not done until `pnpm --filter @project-aqua/swim-formats test` passes (Vitest + coverage).
- Prefer golden corpus tests (`__tests__/meet/golden-corpus.test.ts`) and export→re-import round-trips for export changes.
- Domain helpers (athlete match, entry limits, QT) belong in `@project-aqua/swim-core` with unit tests.

## Apps & packages

| Area | Package / app |
|------|----------------|
| Coach SaaS | `apps/admin` |
| Marketing site | `apps/web` |
| Formats | `packages/swim-formats` |
| Domain (times, events, match) | `packages/swim-core` |
| PDF / print reports | `packages/reports` |
| DB / authz | `packages/db`, `packages/auth` |
| UI | `packages/ui` |

## Skills to follow when relevant

- `.agents/skills/next-best-practices/` — Next.js / RSC
- `.agents/skills/vercel-react-best-practices/` — React performance
- `.agents/skills/frontend-design/` — distinctive UI (stay in admin design tokens)
- `.agents/skills/web-design-guidelines/` — a11y / WIG review
- `.agents/skills/vercel-composition-patterns/` — compound components, no boolean prop sprawl

## Auth & server actions

- Treat every Server Action like a public endpoint: authenticate and authorize inside the action (`requireTeamRole` / plan features).
- Meet import/export is gated to owner + head_coach and the `meet_import` plan feature.

## Agent skills

### Issue tracker

GitHub Issues in this repo (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles with matching label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
