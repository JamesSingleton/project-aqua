# Using time

> Guideline, not a rule. Pick the right time format for the surface — fast to read at a glance, precise on demand.

## Principle

Two questions about time matter to a dashboard user:

1. *How recently did this happen?* — best answered by a relative label (`2m ago`).
2. *Exactly when?* — best answered by an absolute, timezone-explicit timestamp.

Show relative time on the surface; keep the absolute time one hover away. This way the page stays scannable, but the user can always recover the precise moment when they need it (for cross-referencing logs, support tickets, or other systems).

## The rules

### Relative time on the surface

- Use short units: `13s ago`, `4m ago`, `2h ago`, `5d ago`, `3w ago`, `2mo ago`, `1y ago`.
- **Don't** prefix with `about`, `less than`, `over`, or `approximately`. They add noise without information.
- Singular vs plural is fine; `1m ago` is better than `1 m ago`.
- Future times use the same units with `in`: `in 5m`, `in 2d`. Same no-`about` rule.

### Absolute time in the tooltip

Every relative-time element should be wrapped in a `Tooltip` whose content is the exact UTC timestamp:

- Format: `MMM d, yyyy, HH:mm:ss 'UTC'` — e.g. `Jan 29, 2026, 14:03:51 UTC`.
- Always UTC. Don't convert to the user's local timezone; the user expects UTC parity with the API.
- Include seconds — debugging often hinges on them.

### When relative time stops being useful

Past ~30 days, relative time loses precision (`2mo ago` doesn't tell you which week). For surfaces that show older events, switch to absolute time as the primary label and drop the tooltip:

- Up to 30 days: relative on surface, absolute in tooltip.
- Older than 30 days: absolute on surface (`Nov 14, 2025`), no tooltip needed — or a tooltip with the full time-of-day if seconds matter.

The exact threshold can be a project decision (24h, 7d, 30d); the principle is "switch to absolute before the relative form gets imprecise."

## When to show duration instead of a timestamp

- For things that *took* time (a webhook attempt that retried for 12s, a job that ran for 3m), show the duration directly: `12s`, `3m 04s`. Don't make the user subtract two timestamps.
- For things that are *about* to happen, show "in N units" rather than the absolute future time, unless precision matters (a scheduled broadcast).

## Anti-patterns

- `about 2 hours ago`, `less than a minute ago`. → `2h ago`, `<1m ago` only if "<1m" reads cleanly; otherwise `just now`.
- Showing relative time without an absolute tooltip — the user can't correlate to logs.
- Showing absolute time in the user's local timezone — diverges from the API and from other team members.
- Showing the raw ISO string (`2026-01-29T14:03:51.123Z`) as the primary label. Reserve ISO for debug payloads and copy-to-clipboard.
- "13 minutes ago" mixed with "2h ago" on the same surface — pick short or long form per surface and stick to it.

## Related

- [`expose-debuggable-data`](expose-debuggable-data.md) — debug payloads should show full timestamps, not relative ones.
- [`table-required-fields`](table-required-fields.md) — a relative time column is a strong candidate for the main view; a full timestamp belongs in the detail page.
