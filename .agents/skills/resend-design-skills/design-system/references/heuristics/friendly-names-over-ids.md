# Friendly names over IDs

> Guideline, not a rule. Show humans the name they gave a thing; show the ID when they need to wire it up.

## Principle

A friendly name (alias, label, title) tells the user *which* template / domain / contact this is. An ID tells the user how to reference it from code. Both are useful, but they answer different questions. The dashboard should put the friendly name first; the ID is a secondary detail the user reaches for when they're integrating.

A list of opaque `re_a7B...` rows forces the user to mentally translate every line. A list of names with the ID one click away keeps the page scannable and still copy-pasteable.

## Quick chooser

| Resource | Primary identifier in the UI | Where the ID goes |
|----------|------------------------------|-------------------|
| API key | User-given name (`"Production backend"`) | A copy-to-clipboard row in the detail view |
| Domain | The domain itself (`mail.acme.com`) | Not surfaced — the domain *is* the user-facing identifier |
| Template / broadcast | User-given title | Detail page, near the "Use in API" snippet |
| Contact | Friendly name if set, otherwise email | Detail page |
| Audience / segment | User-given name | Detail page |
| Webhook event | None — the event itself is ephemeral | The ID is the row |
| Background job / single email send | The recipient + subject summary | Always available for log correlation |

## When the friendly name is required

- The resource is **long-lived** and the user will refer to it again (API keys, domains, templates, audiences).
- The resource **appears in lists** the user scans regularly.
- The user might **link to it externally** (Slack threads, support tickets).
- The resource is **created by the user** — they expect to name it.

For these, force a name at creation time, or generate a sensible default the user can rename later.

## When the ID is fine on its own

- The resource is **ephemeral** (a single webhook delivery attempt, a single email send, a single job run).
- The resource is **system-generated** and the user never created it.
- The resource only appears in a **debug context** where the user is already operating in IDs (e.g. tracing a request via its ID).

## How to render both together

- Primary: friendly name, in `text-default` weight.
- Secondary: monospace ID in `text-muted` with a copy-to-clipboard affordance. Truncate with an ellipsis if the ID is long; the full value is available in the copied content.
- In a table, the column header is the friendly name. The ID lives in the detail view, not as a second column.

## Fallback when no friendly name exists yet

- For user-creatable resources without a name, show a sensible default (`"Untitled broadcast"`, `"Unnamed key"`) plus a CTA to rename.
- Never show the raw ID as the "name" of a renamable resource — it teaches the user that IDs are the primary identifier, which is the opposite of this heuristic.

## Anti-patterns

- A table of API keys whose first column is `re_a7B9...`. Force a name at creation time.
- Hiding the ID entirely so the user can't paste it into code.
- Showing an ID where the resource already has a more human identifier (the domain, the email address, the title).
- Inventing friendly names for ephemeral events that don't deserve one — webhook event IDs are fine.

## Related

- [`expose-debuggable-data`](expose-debuggable-data.md) — the detail view, where the ID lives, is also where the raw payload lives.
- [`table-required-fields`](table-required-fields.md) — the friendly name belongs in the main table; the ID does not.
