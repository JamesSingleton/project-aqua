---
name: resend-design-system
description: Use when building or modifying UI in the Resend codebase. Provides component APIs, variant options, design tokens, and composition patterns for all src/ui/ primitives.
metadata:
  author: resend
  version: "1.0.0"
---

# Resend Design System

Use primitives from `src/ui/` for all UI work. Never create custom components when a primitive exists. Check `/design/components` pages for live examples.

## Quick Reference

All primitives use `@/ui/{name}` imports. Icons in `@/ui/icons/icon-{name}`.

### Core Components

| Component | Import | Key Variants |
|-----------|--------|-------------|
| Button | `@/ui/button` | appearance: white, gray, fade-gray, fade, fade-red, red. size: 1, 2 |
| TextField | `@/ui/text-field/text-field` | Compound: Root > Slot + Input + Slot. `state`/`size` on **Input**. size: 1, 2, 3 |
| Heading | `@/ui/heading` | size: 1-8. color: white, gray. weight: medium, semibold, bold |
| Text | `@/ui/text` | size: 1-9. color: white, gray, red, yellow |
| Tag | `@/ui/tag` | appearance: gray, green, red, yellow, blue, orange, violet, sand |
| Banner | `@/ui/banner` | Page/section-level messages (`role="alert"`). Auto icon. green=success, yellow=warning, red=error, blue=info. Use Tag for inline item labels |
| Select | `@/ui/select` | Namespace: Root > Trigger + Content > Item. For **value selection** (forms) |
| Dialog | `@/ui/dialog` | Namespace: Root > Trigger + Content > Title. size: 1, 2, full-screen |
| Switch | `@/ui/switch` | checked, onCheckedChange, disabled |
| Checkbox | `@/ui/checkbox` | checked (boolean \| 'indeterminate'), onCheckedChange |
| IconButton | `@/ui/icon-button` | Same variants as Button. **Always** provide `aria-label` |
| DropdownMenu | `@/ui/dropdown-menu` | Namespace: Root > Trigger + Content > Item. For **actions**, not value selection |

### Sizing Scale

| Size | Height | Text | Radius |
|------|--------|------|--------|
| `'1'` | h-6 | text-xs | rounded-lg |
| `'2'` | h-8 | text-sm | rounded-xl |
| `'3'` | h-10 | text-sm | rounded-xl |

### Color Conventions

- Primary action: `appearance="white"` (inverted black/white, flips in dark mode)
- Secondary: `appearance="gray"`
- Subtle/ghost: `appearance="fade"` or `appearance="fade-gray"`
- Destructive: `appearance="red"` or `appearance="fade-red"`

### Key Rules

1. Use `cn()` from `@/lib/cn` for class merging
2. Use `@/` absolute imports everywhere
3. Prefer Server Components; `'use client'` only at lowest interactive leaf — **extract** the interactive part into a small leaf component, don't mark the whole page client
4. Use sentence case for all UI copy
5. State via `state` prop, not booleans — `state="loading"`, `state="disabled"`, `state="invalid"`, `state="read-only"`. Each value is self-sufficient: `state="loading"` already prevents interaction, so don't also add `disabled={}`
6. Compound TextField: `TextField.Root > TextField.Slot? + TextField.Input + TextField.Slot?` — `state` and `size` go on **`TextField.Input`**, not Root. Use `<TextField.Error message={msg} id="x" />` inside a trailing Slot for validation errors — it auto-wires `aria-describedby`. Don't also pass `error=` on Input or set `aria-describedby` manually.
7. Radix namespaces: `import * as Select from '@/ui/select'`
8. `asChild` for links: `<Button asChild><Link href="/x">Label</Link></Button>` — also works on Dialog.Trigger, Tooltip.Trigger

### Server vs Client

Already client (built-in, no extra `'use client'` needed on your part): TextField, Checkbox, Dialog, Drawer, Collapsible, Calendar, BulkActions.

Server-safe: Button, Heading, Text, Tag, Banner, Card, EmptyState, Kbd, IconButton.

**Correct pattern** — extract only the interactive leaf:
```tsx
// page.tsx — Server Component
export default function Page() {
  return <Card><Heading>Title</Heading><DeleteDialog /></Card>;
}

// delete-dialog.tsx — small Client Component
'use client';
export function DeleteDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild><Button appearance="fade-red">Delete</Button></Dialog.Trigger>
      <Dialog.Content size="1"><Dialog.Title>Confirm delete</Dialog.Title></Dialog.Content>
    </Dialog.Root>
  );
}
```

## Patterns

Documented UI patterns live in `design-system/references/patterns/`. A pattern is a composition of `src/ui/` primitives repeated across ≥ 3 dashboard files. When asked "what pattern applies to X?", load `design-system/references/patterns/README.md` first, then check `src/app/(internal)/design/_common/documented-patterns.json` to see what is currently documented.

The `design-audit` skill (see `design-audit/SKILL.md`) uses this directory when deciding whether a detected composition is already a documented pattern or a new candidate.

## References

For detailed documentation, load these as needed:
- `design-system/references/components.md` — Full component catalog with all props and usage
- `design-system/references/design-tokens.md` — Colors, typography, shadows, animations
- `design-system/references/patterns.md` — CVA conventions, compound components, slot system
- `design-system/references/patterns/README.md` — Documented UI composition patterns and scaffolding guide
