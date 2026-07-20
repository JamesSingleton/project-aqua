# Resend Design Skills

An agent skill collection that provides Resend's brand guidelines directly in your workflow.

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

## Usage

Once installed, Claude will automatically apply the skill based on context:

- Ask for brand colors, typography specs, or logo assets → `resend-brand`

### Example Prompts

```
What's the Resend color for error states?
```

```
I'm designing a Resend social graphic. What layout pattern should I use?
```

## License

MIT
