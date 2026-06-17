# Patterns

Documented UI patterns for the Resend dashboard. A pattern is a composition of `src/ui/` primitives that solves a recurring layout or interaction problem and belongs in `/design/patterns/`.

## What counts as a pattern

A pattern must:
- Combine ≥ 2 `src/ui/` primitives in a specific, repeatable structure
- Appear in ≥ 3 dashboard files in substantially the same form
- Have a documented page under `src/app/(internal)/design/patterns/`

A single component usage (even complex) is not a pattern — patterns are compositions.

## Currently documented patterns

`documented-patterns.json` is the authoritative list. As of this writing it is empty (`[]`). This directory will grow as patterns are extracted from the dashboard and documented.

## Pattern scaffolding

When the `design-audit` skill identifies pattern candidates, the design team reviews them and promotes candidates to documented patterns by:

1. Adding a page at `src/app/(internal)/design/patterns/<name>/page.tsx`
2. Adding the name to `documented-patterns.json`
3. Adding a markdown file here (`<name>.md`) describing the pattern

## Relationship to the audit

The `design-audit` rubric (category 5) uses `documented-patterns.json` to decide whether a detected composition is already documented. If the name is NOT in `documented-patterns.json`, the composition is reported as a pattern candidate — not a violation.

Files in this directory serve as the prose reference when Claude is asked "what pattern applies to X?".
