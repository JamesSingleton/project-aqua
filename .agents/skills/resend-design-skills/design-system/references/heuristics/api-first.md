# API-first features

> Guideline, not a rule. Frames how the dashboard and the public API relate to each other.

## Principle

APIs empower users to act independently and to integrate Resend into their own systems. Resend serves builders and makers who use the infrastructure from their preferred language. The dashboard exists to make the same building blocks visible, testable, and easier to operate — not as the canonical surface.

## Overall guidelines

- The API is **stable, predictable, and well-documented**.
- The dashboard should **mirror most API capabilities** where it makes sense to expose them visually.
- The dashboard **does not need to rely on the API internally** — it can call lower-level services directly when that's simpler.
- The API **does not need to support every dashboard capability** — some workflows (e.g. visual editors) are dashboard-only by nature.
- The dashboard is a **laboratory** for testing new API capabilities before they ship publicly.
- Dashboard navigation **should mimic the API schema** as closely as possible, so users can map one to the other without re-learning.

## How to apply this

When designing a new feature:

1. Sketch the API shape first — what resources, fields, and actions exist?
2. Then sketch the dashboard around that shape. Resource names, list/detail structure, and terminology should match what the API exposes.
3. Note which capabilities are dashboard-only (e.g. drag-and-drop email editor) and which are API-only (e.g. raw batch sends). Both are legitimate.

## Anti-patterns

- Inventing a dashboard concept that has no API equivalent and no path to one (creates a "two products" feel).
- Naming things differently in the dashboard than in the API for the same underlying resource.
- Designing the API as an afterthought of the dashboard.
- Forcing every dashboard convenience to also exist in the API — see [`predictable-by-design`](predictable-by-design.md) for where parity actually matters.
