# Resend Design Skills

An agent skill collection that provides Resend's brand guidelines and design system directly in your workflow.

## Installation

```bash
npx skills add resend/design-skills
```

## What's Included

### resend-brand

Brand guidelines for marketing materials, social graphics, presentations, and external-facing visual content.

**Colors**

- Resend Black: `#000000` / Resend White: `#FDFDFD`
- Brand tokens: `bg-brand`, `bg-brand-hover`, `text-on-brand`, `ring-brand` (theme-aware: black light / white dark)
- Semantic status colors: error (red), warning (yellow/amber), success (green), info (blue), link
- Each status has paired tokens: `bg-X`, `border-X`, `border-X-subtle`, `text-X` (plus hover/ring variants where used)

**Typography**

- **Domaine Display Narrow** — Display headlines (never in product UI)
- **Favorit** — Headings & titles
- **Inter** — Body text
- **CommitMono** — Code

**Logo Assets**

- CDN links to official wordmarks and lettermarks (SVG/PNG)
- Usage restrictions and clearspace requirements

**Design Elements**

- Gradients (font, smooth, border, rainbow)
- Glass blur effect, noise texture
- Layout patterns (Right Object Scene, Interface Scene, Text Only variants, Big Number)

---

### resend-design-system

Component APIs, design tokens, and composition patterns for building product UI inside the Resend codebase.

**UI Components** — 57+ primitives in `src/ui/` built on Radix UI and styled with CVA:

- **Actions** — Button, IconButton, CopyButton
- **Form** — TextField (compound), Select, Checkbox, Switch, Calendar
- **Display** — Heading, Text, Tag, Banner, Avatar, Card, EmptyState
- **Overlay** — Dialog, Drawer, Popover, Tooltip, ContextMenu, DropdownMenu
- **Navigation** — Tabs, Pagination, Breadcrumb, Link, InternalLink
- **Feedback** — Toast, Skeleton, LoadingDots
- **Icons** — 100+ SVG icons in `src/ui/icons/`

**Design Tokens** from `src/styles/globals.css` (primitives) and `src/styles/tokens.css` (semantic layer):

- Semantic tokens: surfaces (`bg-elevated`, `bg-subtle`), text (`text-default`, `text-emphasis`, `text-muted`, `text-placeholder`), borders (`border-default`, `border-subtle`, `border-interactive`), interactive (`bg-interactive`, `bg-interactive-hover`, `ring-focus`), brand (`bg-brand` + variants), status (error/warning/success/info), link (`text-link`, `border-link`, `ring-link`)
- Primitives: gray scale 1–12 (solid + `a2`/`a3`/`a4` alpha), Radix-based colored families (red, yellow→amber-alpha, green, blue, etc.)
- Typography scale (Inter, ABC Favorit, Domaine, Commit Mono)
- Component sizing scale (1/2/3), border radius, shadows, 20+ animations

**Token philosophy:** prefer semantic names first; fall through to primitives only when no semantic token fits.

**Component Patterns** — CVA conventions, compound components, slot system, Server vs Client boundaries

---

### marketing-pages

Page structure, component reuse rules, and public primitives for creating and editing marketing pages in `src/app/(website)/`.

**Page Structure** — Required `PublicPage.Root/Header/Container/Footer` composition pattern

**Public Primitives** from `src/website/` (never use `src/ui/` on marketing pages):

- `PublicHeading` — sizes 1–6, colors: white | gradient
- `PublicText` — sizes 1–5, colors: white | gray | gradient
- `PublicButton` — appearances: white | black | black-fade | fade | red

**Shared Components** — 16+ reusable sections in `src/components/website/` (FeatureGrid, Carousel, CodeSnippet, Quote, etc.)

**SEO** — Required metadata export and JSON-LD structured data for every page

---

## Usage

Once installed, Claude will automatically apply the right skill based on context:

- Ask for brand colors, typography specs, or logo assets → `resend-brand`
- Build UI components, forms, or pages in the Resend codebase → `resend-design-system`
- Create or edit marketing pages in `src/app/(website)/` → `marketing-pages`

### Example Prompts

```
What's the Resend color for error states?
```

```
Build a settings form with email validation using Resend's TextField
```

```
Create a confirmation dialog with a destructive delete action
```

```
I'm designing a Resend social graphic. What layout pattern should I use?
```

```
Create a new marketing page for the webhooks feature
```

## License

MIT
