# Project Aqua Admin — Setup

Coach SaaS dashboard for competitive swim team management.

## Prerequisites

- Node.js 24+
- pnpm 10+
- Supabase CLI (for local Postgres)

## Quick start

```bash
# From repo root
pnpm install

# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Copy env and configure
cp apps/admin/.env.example apps/admin/.env.local
# Set BETTER_AUTH_SECRET: openssl rand -base64 32

# Start admin app
pnpm dev:admin
```

Open http://localhost:3001

### Dev memory / Turbopack cache

Long `pnpm dev:admin` sessions with heavy HMR can grow `apps/admin/.next` (especially `.next/dev/cache/turbopack`) into multi‑GB on disk and push `next-server` RSS into the multi‑GB range. That is Turbopack cache retention, not an app-level leak.

When RSS feels painful:

```bash
# Stop the admin dev server, then from repo root:
pnpm clean:admin
pnpm dev:admin
```

Or from `apps/admin`: `pnpm clean:next`.

## Architecture

- **Auth:** Better Auth with organization plugin (team = organization)
- **Database:** Supabase Postgres + Drizzle ORM (`packages/db`)
- **Email:** React Email + Resend (`packages/emails`)
- **Billing:** Stripe per-team subscriptions (`packages/billing`)
- **USA Swimming:** SWIMS vendor API (`packages/usa-swimming`)
- **File formats:** Hy-Tek / SDIF meet & roster parsers (`packages/swim-formats`) — Meet Events (EV3/HYV), Results (CL2/HY3/SD3), Entries/Roster (CL2+HY3), ZIP packs

## Routes

| Route | Description |
|-------|-------------|
| `/sign-in`, `/sign-up` | Coach authentication |
| `/onboarding` | Create first team |
| `/team/[teamId]` | Dashboard |
| `/team/[teamId]/roster` | Swimmer roster |
| `/team/[teamId]/meets` | Meet management |
| `/team/[teamId]/attendance` | Practice attendance |
| `/team/[teamId]/progression` | Per-swimmer time trends and meet history |
| `/team/[teamId]/analytics` | Team volume, attendance, and top times |
| `/team/[teamId]/settings` | Team settings |
| `/team/[teamId]/settings/billing` | Subscription management |
| `/team/[teamId]/settings/usa-swimming` | SWIMS integration |

## Workspace packages

- `@project-aqua/swim-core` — Domain types, validators, plan limits
- `@project-aqua/db` — Drizzle schema, queries, authz
- `@project-aqua/auth` — Better Auth server/client
- `@project-aqua/emails` — Transactional email templates
- `@project-aqua/billing` — Stripe integration
- `@project-aqua/usa-swimming` — SWIMS API client
- `@project-aqua/swim-formats` — Meet/roster file parsers
