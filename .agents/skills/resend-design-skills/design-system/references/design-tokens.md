# Design Tokens

Defined in `src/styles/globals.css` (primitives) and `src/styles/tokens.css` (semantic layer) using Tailwind CSS v4 with CSS custom properties.

## Color System

Built in two layers:

- **Semantic tokens** (the primary path) — intent-named utilities like `bg-elevated`, `text-default`, `bg-error`. Components should reach for these first.
- **Primitives** — raw Radix-based color steps (`gray-1`..`gray-12`, `red-3`, etc.). Available as escape hatches when no semantic token fits.

### Semantic tokens

#### Surfaces

| Token | Purpose |
| --- | --- |
| `bg-background` | Page background. `#fdfdfd` light / `#000` dark. |
| `bg-canvas` | Canvas grid pattern surfaces. |
| `bg-subtle` | Quietest page surface tier (`gray-1`). |
| `bg-elevated` | Cards, sections, surfaces raised above the page (`gray-2`). |

#### Text

| Token | Purpose |
| --- | --- |
| `text-emphasis` | Headings, prominent labels, input value (`gray-12`). |
| `text-default` | Body text, button labels, form labels, helper text (`gray-11`). |
| `text-muted` | Captions, metadata, disabled (`gray-8`). |
| `text-placeholder` | Input placeholders (theme-asymmetric: `gray-5` light / `gray-8` dark). |
| `text-on-brand` | Text inside the primary button (white light / black dark). |

#### Borders

| Token | Purpose |
| --- | --- |
| `border-default` | Default static border — cards, sections, dividers (`gray-3`). |
| `border-subtle` | Quieter static border (`gray-2`). |
| `border-interactive` | Border on interactive components — Button (gray), Select, Input (`gray-a3`). |

#### Interactive (gray)

| Token | Purpose |
| --- | --- |
| `bg-interactive` | Rest bg for Button (gray), Select, Input, Tag (`gray-a2`). |
| `bg-interactive-hover` | Hover, focus, pressed, expanded, selected bg — all collapse to one value (`gray-a3`). |
| `ring-focus` | Default focus ring (`gray-a3`). |

#### Brand (primary button)

| Token | Purpose |
| --- | --- |
| `bg-brand` | Primary button rest bg. `#000` light / `#fff` dark. |
| `bg-brand-hover` | Primary button hover bg. `black-a11` light / `gray-12` dark. |
| `ring-brand` | Primary button focus ring. `black-a4` light / `gray-a4` dark. |

#### Error (red, destructive)

| Token | Primitive | Purpose |
| --- | --- | --- |
| `bg-error` | `red-a3` | Invalid input bg, destructive button rest, Tag |
| `bg-error-hover` | `red-a5` | Destructive button hover |
| `border-error` | `red-a6` | Invalid input, Toast error, form validation |
| `border-error-subtle` | `red-a4` | Quieter error border — Tag, Banner |
| `text-error` | `red-a11` | Error text, error icons, validation messages |
| `ring-error` | `red-a7` | Destructive button focus ring |

#### Warning (yellow → amber alpha)

| Token | Primitive | Purpose |
| --- | --- | --- |
| `bg-warning` | `amber-a3` | Tag yellow, Toast warning `before:bg` |
| `border-warning` | `amber-a6` | Toast warning outline |
| `border-warning-subtle` | `amber-a4` | Quieter warning border — Tag |
| `text-warning` | `amber-a11` | Warning icons (TriangleAlert), banners, pending spinners |

#### Success (green)

| Token | Primitive | Purpose |
| --- | --- | --- |
| `bg-success` | `green-a3` | Tag green, Toast success `before:bg`, audience subscribed |
| `border-success` | `green-a6` | Toast success, Switch checked state |
| `border-success-subtle` | `green-a4` | Quieter success border — Tag |
| `text-success` | `green-a11` | Success icons (CircleCheck), copy feedback, healthy states |

#### Info (blue)

| Token | Primitive | Purpose |
| --- | --- | --- |
| `bg-info` | `blue-a3` | Tag blue |
| `border-info-subtle` | `blue-a4` | Tag blue border |
| `text-info` | `blue-a11` | Informational icons (IconOpenedEvent), status text |

#### Link

For clickable text and link affordances. Distinct from `text-info` (which is for informational icons / status).

| Token | Primitive | Purpose |
| --- | --- | --- |
| `text-link` | `blue-a9` | Clickable text, links |
| `border-link` | `blue-a9` | Link hover underline (e.g. `hover:border-link`) |
| `ring-link` | `blue-a7` | Link focus ring (e.g. `focus-visible:ring-link`) |

### When to use semantic vs primitive

**Prefer semantic tokens whenever the use case matches one of the named roles above.** They:

- Decouple intent from value — primitive can shift without touching components.
- Collapse multi-line `dark:` variants into single tokens for theme-aware roles.
- Survive scale changes (e.g. the gray renumber from 10 → 12 steps).

**Fall through to primitives when:**

- The intent isn't covered by a semantic token (e.g. softer text tiers `text-red-10` / `text-red-9` for fade-style destructive buttons).
- One-off decorative use (gradient stops, selection styling, niche backgrounds).
- Mid-scale grays (`gray-4` through `gray-7`) — these have no semantic name and remain available as escape hatches.

### Primitives

#### Gray scale

| Range | Notes |
| --- | --- |
| `gray-1`..`gray-12` | Solid scale. 12 steps following Radix's convention. |
| `gray-a2`, `gray-a3`, `gray-a4` | Alpha steps. Only these three are kept — `a1`, `a5`–`a12` are deprecated. |
| `light-gray-1`..`light-gray-12`, `light-gray-a1`..`light-gray-a10` | Static-light scale — does not flip with theme. Used by `fade-gray` Button variant and a few editor surfaces. |

#### Colored families (Radix alpha)

Available palettes — every step is alpha-backed via the `@theme` block, so e.g. `bg-red-3` resolves to `var(--red-a3)`:

`gray`, `red`, `yellow` (→ amber-alpha), `green`, `blue`, `orange`, `violet`, `sand`, `cyan`, `mauve`, `black`.

`light-gray-*` is the static-light gray scale.

### Deprecated palettes

The following Tailwind default palettes are **not in the system**. Do not use them in any utility:

`slate`, `zinc`, `neutral`, `stone`, `emerald`, `teal`, `sky`, `indigo`, `purple`, `fuchsia`, `pink`, `rose`, `amber` (use `yellow-*` instead), `lime`.

Map by intent, preferring semantic tokens:

| Deprecated palette | Prefer semantic | Or primitive |
| --- | --- | --- |
| `slate`, `zinc`, `neutral`, `stone` | `text-default`, `text-muted`, `bg-elevated`, `border-default` | `gray-*` (or `sand-*` for warm neutrals) |
| `emerald`, `teal`, `lime` | `text-success`, `bg-success`, `border-success` | `green-*` |
| `sky` | `text-info`, `text-link` | `blue-*` (or `cyan-*` for specific accent) |
| `indigo`, `purple`, `fuchsia` | — *(no semantic family for violet currently)* | `violet-*` |
| `pink`, `rose` | `text-error`, `bg-error`, `border-error` | `red-*` |
| `amber` | `text-warning`, `bg-warning`, `border-warning` | `yellow-*` (which maps to amber alpha) |

### Radix step convention (primitive picks)

When reaching for a raw primitive, Radix's 12-step convention informs which step fits which intent. The semantic tokens above already follow this.

| Step | Intent |
| --- | --- |
| 1 | App background |
| 2 | Subtle background |
| 3 | UI element background (rest) |
| 4 | Hovered UI element background |
| 5 | Active / selected UI element background |
| 6 | Subtle borders and separators |
| 7 | UI element border and focus rings |
| 8 | Hovered UI element border |
| 9 | Solid backgrounds |
| 10 | Hovered solid backgrounds |
| 11 | Low-contrast text |
| 12 | High-contrast text |

### Event lifecycle colors (not in semantic layer)

Email/automation lifecycle events have dedicated color mappings in `src/schemas/{emails,broadcasts,automations,resend-webhooks}.ts`, referenced via raw `var(--<color>-aN)`. These are product-data, not UI semantics — `var(--mauve-a11)` for `scheduled`, `var(--cyan-a11)` for `received`, `var(--violet-a11)` for `clicked`, etc. UI components consume these via the schema; do not invent parallel tokens for these states.

## Typography

| Token | Font | Usage |
| --- | --- | --- |
| `font-sans` | Inter | Body text, UI (default) |
| `font-display` | ABC Favorit | Large headings (size 7-8) |
| `font-domaine` | Domaine | Serif accents |
| `font-mono` | Commit Mono | Code, monospace |

Use `Heading` and `Text` components with `size` prop rather than raw Tailwind text classes.

## Sizing Scale

| Size | Height | Padding | Text | Radius |
| --- | --- | --- | --- | --- |
| `'1'` | `h-6` (24px) | `px-2` | `text-xs` | `rounded-lg` |
| `'2'` | `h-8` (32px) | `px-3` | `text-sm` | `rounded-xl` |
| `'3'` | `h-10` (40px) | `px-3` | `text-sm` | `rounded-xl` |

### Border Radius

| Class | Value | Usage |
| --- | --- | --- |
| `rounded-lg` | 0.5rem | Size 1 components |
| `rounded-xl` | 0.75rem | Size 2-3 components |
| `rounded-2xl` | 1rem | Banners, larger elements |
| `rounded-3xl` | 1.5rem | Cards |
| `rounded-4xl` | 2rem | Dialogs |

## Shadows

`--shadow-3xl` (large), `--shadow-4xl` (extra-large), `--shadow-button` (button-specific).

## Animations

**Scale & Fade:** `animate-open-scale-in-fade`, `animate-open-scale-up-fade`, `animate-close-scale-out-fade`
**Slide & Fade:** `animate-open-slide-up-fade`, `animate-open-slide-down-fade`, `animate-close-slide-up-fade`, `animate-close-slide-down-fade`
**Utility:** `animate-shine`, `animate-disco`, `animate-scroll-x`, `animate-caret-blink`, `animate-accordion-slide-down/up`, `animate-collapsible-slide-down/up`, `animate-fade-in`, `animate-fade-out`

### Custom Utilities

| Class | Effect |
| --- | --- |
| `fade-in-black` | Horizontal fade mask |
| `bg-shine` | Animated shine effect |
| `bg-gradient-fade` | Gradient fade background (Banner) |
| `effect-font-styling` | Display font styling for headings 7-8 |

## Dark Mode

Via Tailwind `dark:` prefix. Background flips `#fdfdfd` → `#000`. Theme-aware semantic tokens (`bg-brand`, `text-placeholder`, etc.) handle their own theme switching internally. Gray scale adjusts via Radix-style remapping. Use `dark:` only for manual overrides when no semantic token covers the case.
