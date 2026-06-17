---
name: marketing-pages
description: Use when creating, updating, editing, or deleting marketing/public pages in the Resend codebase. Covers page structure, component reuse rules, and the distinction between public and product design systems.
---

## Scope

Marketing pages live in `src/app/(website)/`. Product pages live in `src/app/(dashboard)/`. This skill covers the `(website)` route group only.

## Critical Rule: Always Reuse, Never Create

Before writing any component, search for an existing one. The codebase has two separate component systems — **never mix them**.

| System | Path | Use for |
|--------|------|---------|
| Product UI | `src/ui/` | Dashboard/authenticated pages only |
| Public primitives | `src/website/` | Marketing pages typography, buttons |
| Public compositions | `src/components/website/` | Marketing feature sections |
| Page structure | `src/components/public-page.tsx` | Every marketing page layout |

## Page Structure (required pattern)

Every marketing page must follow this composition:

```tsx
import * as PublicPage from '@/components/public-page';

export default function MyPage() {
  return (
    <>
      <script type="application/ld+json" ... />  {/* SEO JSON-LD */}
      <PublicPage.Root>
        <PublicPage.Header />
        <MyPageHero />  {/* or PublicPage.Hero */}
        <PublicPage.Container>
          {/* feature sections */}
          <CallToAction />
        </PublicPage.Container>
        <PublicPage.Footer />
      </PublicPage.Root>
    </>
  );
}
```

## Public Primitives (`src/website/`)

Use these instead of `src/ui/` equivalents on marketing pages:

- `PublicHeading` — sizes 1–6, colors: `white` | `gradient`
- `PublicText` — sizes 1–5, colors: `white` | `gray` | `gradient`, weights: `normal` | `medium` | `semibold` | `bold`
- `PublicButton` — appearances: `white` (default) | `black` | `black-fade` | `fade` | `red`; sizes: `2` | `3` | `4`; supports `asChild`, `iconLeft`, `iconRight`
- `PublicPage.accordion` — accordion sections
- `PublicPage.avatar` — avatar components

See `references/components.md` for full APIs and `src/components/website/` inventory.

## Metadata & SEO (required for new pages)

```tsx
export const metadata: Metadata = {
  alternates: { canonical: '/your-path' },
  title: 'Page Title · Resend',
  description: '...',
  openGraph: { images: [{ url: '/static/cover-image.jpg' }] },
};
```

Always add JSON-LD structured data using `getCompanyJsonLd()` from `@/utils/json-ld` and `getBaseUrl()` from `@/utils/base-url`.

## Adding a New Marketing Page

1. Create `src/app/(website)/your-page/page.tsx`
2. Use `PublicPage.Root/Header/Container/Footer` structure
3. Create page-specific sections in `src/components/product-pages/your-page/` or reuse from `src/components/website/`
4. Add `metadata` export and JSON-LD script
5. Update footer links in `src/components/public-page.tsx` if needed

## Deleting a Marketing Page

1. Remove `src/app/(website)/your-page/` directory
2. Remove related components in `src/components/product-pages/your-page/` if page-specific
3. Remove footer/nav links referencing the page
4. Add redirect in `next.config.ts` if the URL was public

## Styling Notes

- Marketing pages use `src/styles/website.css` (loaded via `(website)/layout.tsx`)
- Theme is forced dark — do not use light-mode-only classes
- Use Tailwind v4 utilities; avoid inline styles
- `src/ui/` classes may conflict — always prefer `src/website/` primitives

## References

- `references/components.md` — Full component inventory with props and import paths
