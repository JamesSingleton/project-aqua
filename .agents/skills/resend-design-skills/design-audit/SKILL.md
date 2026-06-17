---
name: design-audit
description: Audit the Resend dashboard for design system alignment. Routes here when a user says "audit design", "design alignment", "dashboard design audit", or when triggered by the scheduled weekly routine.
metadata:
  author: resend
  version: "1.0.0"
---

# Design Audit Skill

Audits `src/app/(dashboard)*` for design system compliance and `src/ui/` for documentation coverage. Reports findings without modifying any source files or opening PRs.

## When to invoke

- User says "audit design", "run design audit", "dashboard design alignment"
- The scheduled Monday routine fires this skill
- User asks about undocumented components or design violations

## How to run the audit

**This skill is read-only. Never edit source files, create branches, or open PRs.**

### Step 1 — Load context

1. Read `src/app/(internal)/design/_common/sidebar-data.ts` to extract:
   - The ignore list (files that should not be documented: `_common`, `layout.tsx`, `shared.ts`, `page.tsx`, `todo`)
   - The alias map (e.g. `"avatar team"` → `"avatar"`, `"command"` → `"combobox"`)
2. Read `src/app/(internal)/design/_common/documented-components.json` for the list of documented components
3. Read `src/app/(internal)/design/_common/documented-patterns.json` for the list of documented patterns
4. Get the current commit SHA: `git rev-parse HEAD`

### Step 2 — Run rubric checks

Follow `references/rubric.md` exactly. Run all categories:
1. Missing documentation
2. Component substitution violations
3. Token misuse
4. Deprecated component usage
5. Pattern candidates
6. Rubric candidates (implicit — note systemic issues not covered by any rule)
7. Copy & brand voice

Cross-reference the `resend-design-system` skill to verify whether a DS primitive exists for a flagged use case before marking it a violation.

### Step 3 — Build the report

Emit the structured JSON defined in `references/report-format.md`, then render it as markdown per the template in that file.

### Step 4 — Deliver via Linear

Follow `references/linear-delivery.md` to file or update the Linear issue. Before creating any tickets, run the triage-backlog preflight in that doc — if 10+ tickets are already pending in Triage, defer non-error tickets this run.

## References

Load these when running the audit:
- `design-audit/references/rubric.md` — what counts as a violation and how to detect it
- `design-audit/references/report-format.md` — exact JSON + markdown report structure
- `design-audit/references/linear-delivery.md` — Linear MCP playbook for filing the issue
