# Marketing Page Components Reference

## Page Structure (`src/components/public-page.tsx`)

```tsx
import * as PublicPage from '@/components/public-page';

// Exports:
PublicPage.Root       // <div className="bg-black isolate">
PublicPage.Header     // sticky nav with logo + links
PublicPage.Hero       // PublicPageContainer with pt-16
PublicPage.Container  // PublicPageContainer (content width)
PublicPage.Footer     // global site footer (do not duplicate)
```

## Public Primitives (`src/website/`)

### PublicHeading (`@/website/heading`)
```tsx
<PublicHeading
  as="h1" | "h2" | "h3" | "h4" | "h5" | "h6"  // default: h2
  size="1" | "2" | "3" | "4" | "5" | "6"        // default: 4
  color="white" | "gradient"                      // default: white
  className?
/>
```
Sizes: 1=base, 2=xl, 3=2.25rem, 4=3–3.5rem, 5=4–4.8rem (Domaine), 6=4–6rem (Domaine)

### PublicText (`@/website/text`)
```tsx
<PublicText
  as="span" | "p" | "strong"  // default: span
  size="1" | "2" | "3" | "4" | "5"  // default: 2
  color="white" | "gray" | "gradient"  // default: gray
  weight="normal" | "medium" | "semibold" | "bold"  // default: normal
  className?
/>
```

### PublicButton (`@/website/button`)
```tsx
<PublicButton
  appearance="white" | "black" | "black-fade" | "fade" | "red"  // default: white
  size="2" | "3" | "4"   // default: 2
  state="normal" | "disabled" | "loading"
  asChild?   // renders child element instead of <button>
  iconLeft?  // ReactNode
  iconRight? // ReactNode
/>
```

## Shared Website Components (`src/components/website/`)

| Component | Import path | Description |
|-----------|-------------|-------------|
| `FeatureHeading` | `@/components/website/feature-heading` | Section headings with eyebrow |
| `FeatureDetails` | `@/components/website/feature-details` | Feature bullet list |
| `FeatureGrid` | `@/components/website/feature-grid` | Grid of feature cards |
| `FeatureSteps` | `@/components/website/feature-steps` | Numbered step list |
| `FeaturePill` | `@/components/website/feature-pill` | Small pill/tag badge |
| `Quote` | `@/components/website/quote` | Customer/testimonial quote |
| `Carousel` | `@/components/website/carousel` | Horizontal carousel |
| `CodeSnippet` | `@/components/website/code-snippet` | Syntax-highlighted code |
| `SubtleCta` | `@/components/website/subtle-cta` | Low-key CTA section |
| `PublicBorderLight` | `@/components/website/public-borderlight` | Animated border glow |
| `PublicFadeBorder` | `@/components/website/public-fadeborder` | Faded border effect |
| `PublicLightsource` | `@/components/website/public-lightsource` | Radial light effect |
| `BorderTrail` | `@/components/website/border-trail` | Animated border trail |
| `Wrapper3dMouse` | `@/components/website/wrapper-3d-mouse` | 3D mouse parallax |
| `BackgroundScrollOpacity` | `@/components/website/background-scroll-opacity` | Scroll-driven opacity |
| `LlmExplainer` | `@/components/website/llm-explainer` | LLM feature explainer |

## CTAs (`src/components/ctas/`)

```tsx
import { CallToAction } from '@/components/ctas/cta';
// Full-width CTA section — place at bottom of every page before Footer
```

## Feature Page Sections (`src/components/product-pages/`)

Organized by feature: `email-api/`, `smtp/`, `webhooks/`, `inbound/`, `broadcasts/`, `audiences/`, `templates/`, `transactional/`, `marketing/`

Each exports named components like `<EmailApiHero />`, `<EmailApiCarousel />`, etc.

## Utilities

```tsx
import { getBaseUrl } from '@/utils/base-url';
import { getCompanyJsonLd } from '@/utils/json-ld';
import { cn } from '@/lib/cn';
```

## DO NOT USE on marketing pages

- `src/ui/button` → use `src/website/button`
- `src/ui/text` → use `src/website/text`
- `src/ui/heading` (if exists) → use `src/website/heading`
- Dashboard layout components (`DashboardShell`, `Sidebar`, etc.)
