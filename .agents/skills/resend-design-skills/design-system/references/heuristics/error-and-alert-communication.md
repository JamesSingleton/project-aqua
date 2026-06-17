# Error and alert communication

> Guideline, not a rule. Helps choose how visibly an error should appear, based on how predictable it is and how much the user needs to deal with it now.

## The decision

When something goes wrong, where does the message live? Attached to the offending field, as a global notification, or as a full page error?

## Principle

Match the surface to the predictability and scope of the error. Predictable, local problems get local feedback; unpredictable, page-breaking problems get prominent surfaces. The user should never have to hunt for the explanation of a failure they just caused.

## Field error

Use to **prevent predictable mistakes from happening**, or to point at the exact field that's wrong.

- Validation rules the form already knows (required, format, length).
- Rendered via `TextField.Error`. The primitive shows an error icon in the field's slot when the field is invalid and reveals the message in a tooltip when the user hovers or focuses the icon — no inline text below the field.
- Keeps the field's footprint stable (no layout shift when the error appears) and fixes the user's attention on the field that needs changing.

## Global notification

Use for any alert that needs the user's immediate attention regardless of which page they're on.

- Account suspended, billing failed, service-wide incidents.
- Persists across navigation until acknowledged or resolved.
- Reserve for rare, high-priority signals — overuse trains users to dismiss them.

## Page error

Use for uncaught runtime errors that block the entire page from rendering.

- The page can't recover on its own; the user must reload, navigate away, or be redirected.
- Should explain in plain language what happened and offer a next step.

## Quick chooser

| Problem profile | Surface |
|-----------------|---------|
| Predictable, scoped to a field | Field error (`TextField.Error`) |
| Account- or product-wide, must not be missed | Global notification |
| Page cannot render at all | Page error |

## Anti-patterns

- Toast notifications for validation errors that should have been a field error.
- A `<p>` of error text rendered below a `TextField` — the field-error tooltip is the canonical surface; inline message text creates layout shift and bypasses the primitive.
- Global notifications for routine, recoverable issues — desensitises the user.
- Page errors that say "Something went wrong" with no recovery path.
