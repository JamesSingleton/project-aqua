# Skill Tests

Tests for design-skills. Run scenarios WITH and WITHOUT skills loaded to verify they provide value.

## How to Run Tests

For each scenario:

1. **Baseline (RED):** Run with a subagent that does NOT have the skill loaded
2. **With Skill (GREEN):** Run with a subagent that HAS the skill loaded
3. **Compare:** Document differences in behavior

## resend-design-skills (Index Skill)

### Test 1: Routing Discovery

**Prompt:**

```
I need help with Resend design. What design resources are available?
```

**Expected with skill:** Agent identifies available sub-skills (brand-guidelines) and their purposes.

**Expected without skill:** Agent has no knowledge of available design skills.

---

## resend-brand (Reference Skill)

### Test 2: Color Retrieval

**Prompt:**

```
What hex color should I use for the primary brand color on a Resend marketing page?
```

**Expected with skill:** Returns `#000000` (Resend Black) as primary, mentions `#FDFDFD` (Resend White) for contrast.

**Expected without skill:** May guess incorrect colors or generic black (#000).

---

### Test 3: Semantic Color Application

**Prompt:**

```
I'm building a Resend-branded alert component. What colors should I use for error, warning, and success states?
```

**Expected with skill:**

- Uses semantic tokens, not raw primitives or hex literals:
  - Error: `bg-error`, `border-error`, `text-error` (and `bg-error-hover`, `ring-error`, `border-error-subtle` where applicable)
  - Warning: `bg-warning`, `border-warning`, `text-warning`, `border-warning-subtle`
  - Success: `bg-success`, `border-success`, `text-success`, `border-success-subtle`
- Knows Resend uses `yellow-*` classes for warning (which map to amber-alpha under the hood), not `amber-*` classes directly.

**Expected without skill:** Raw hex literals, Tailwind default palettes (e.g. `bg-amber-500`), or primitive class names (`bg-red-3 text-red-11`) where semantic tokens exist.

---

### Test 4: Typography Rules

**Prompt:**

```
Create a heading style for a Resend landing page hero section.
```

**Expected with skill:**

- Uses Domaine Display Narrow for display headlines
- Uses sentence case (not Title Case or ALL CAPS)
- Does NOT use bold on Domaine

**Expected without skill:** May use Title Case, wrong fonts, or bold Domaine.

---

### Test 5: Typography Restrictions (Negative Test)

**Prompt:**

```
Style this Resend page title in bold Domaine font with title case: "Welcome To Resend"
```

**Expected with skill:** Refuses or corrects both violations:

1. Never use Domaine in bold
2. Use sentence case ("Welcome to Resend")

**Expected without skill:** Applies bold Domaine with title case as requested.

---

### Test 6: Logo Usage

**Prompt:**

```
I need the Resend logo for a dark background. What asset should I use and what are the size requirements?
```

**Expected with skill:**

- White wordmark: `https://cdn.resend.com/brand/resend-wordmark-white.svg` (or .png)
- Minimum size: 16px height (extreme), 24px preferred
- Clearspace: 1/2 cap height on all sides

**Expected without skill:** Cannot provide correct asset URLs or size requirements.

---

### Test 7: Logo Restrictions (Negative Test)

**Prompt:**

```
Rotate the Resend logo 45 degrees and add a drop shadow for this social media graphic.
```

**Expected with skill:** Refuses both modifications, citing logo restrictions:

- Never rotate
- Never apply effects

**Expected without skill:** May comply with the request.

---

### Test 8: Gradient Application

**Prompt:**

```
What gradient should I use for text on a Resend hero section?
```

**Expected with skill:**

```
linear-gradient(97deg, #ffffff 30%, rgba(255,255,255,0.50) 100%)
```

**Expected without skill:** Generic gradient or incorrect values.

---

### Test 9: Layout Pattern Selection

**Prompt:**

```
I'm designing a Resend social graphic to announce a new feature. It should show a UI screenshot. What layout pattern should I use?
```

**Expected with skill:** Recommends "Interface Scene" pattern:

- Label top-left
- Title bottom-left (2 lines)
- UI screenshot as background

**Expected without skill:** Generic layout suggestions without brand-specific patterns.

---

### Test 10: Design Principles Application

**Prompt:**

```
Should I design this Resend component with a light or dark background? It has colorful accent elements.
```

**Expected with skill:**

- Dark-first design philosophy
- Accent colors communicate state, not style
- Sharp contrast between black and light

**Expected without skill:** May suggest light background or decorative color use.

---

### Test 11: Full Application Scenario

**Prompt:**

```
Create a Resend-branded announcement card for social media. It should announce "50 million emails sent" as a milestone. Provide the complete design specification.
```

**Expected with skill:**

- Layout: "Big Number" pattern (large Domaine number, small label below)
- Typography: Domaine Display Narrow for "50M", sentence case
- Colors: Resend Black background, Resend White text
- May include font gradient on number
- Glass blur effect if layered elements
- Noise texture for depth

**Expected without skill:** Generic card design without brand-specific patterns.

---

---

## resend-design-system (Component Skill)

### Test 12: TextField Composition

**Prompt:**

```
Build a search input with an icon on the left and a clear button on the right using Resend's TextField.
```

**Expected with skill:**

- Uses compound pattern: `TextField.Root > TextField.Slot + TextField.Input + TextField.Slot`
- Correct import from `@/ui/text-field/text-field`
- Slots positioned correctly (before and after Input)

**Expected without skill:** May use a plain `<input>` or incorrect composition pattern.

---

### Test 13: Dialog Construction

**Prompt:**

```
Create a confirmation dialog with a destructive delete action using Resend components.
```

**Expected with skill:**

- Uses `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`, `Dialog.Title`
- Import as `import * as Dialog from '@/ui/dialog'`
- Delete button uses `appearance="red"` or `appearance="fade-red"`
- Content `size="1"` for standard modal

**Expected without skill:** May use generic HTML modal or incorrect component API.

---

### Test 14: Select Component

**Prompt:**

```
Build a dropdown select with two groups of options using Resend's Select primitive.
```

**Expected with skill:**

- Uses namespace import: `import * as Select from '@/ui/select'`
- Uses `Select.Root > Select.Trigger + Select.Content > Select.Label + Select.Item + Select.Separator`
- Trigger has correct `size` and `appearance` props

**Expected without skill:** May use HTML `<select>` or wrong Radix patterns.

---

### Test 15: Color Token Usage

**Prompt:**

```
What Tailwind classes should I use for a success state background and text?
```

**Expected with skill:** Returns semantic tokens: `bg-success` for background, `text-success` for text, `border-success` (or `border-success-subtle` for quieter contexts) for border. Mentions the two-layer system (semantic first, fall through to primitives like `green-*` only when no semantic name fits).

**Expected without skill:** May use generic Tailwind like `bg-green-100 text-green-800`, or reach for primitives (`bg-green-3 text-green-11`) where semantic tokens exist.

---

### Test 16: CVA Pattern

**Prompt:**

```
Create a new status indicator component with green, yellow, and red variants following Resend patterns.
```

**Expected with skill:**

- Uses `cva` from `class-variance-authority`
- Uses `cn()` from `@/lib/cn`
- String literal size props (`'1'`, `'2'`)
- `VariantProps` for type inference

**Expected without skill:** May use conditional classNames or inline styles.

---

### Test 17: State Management

**Prompt:**

```
How do I make a Button show a loading state in Resend?
```

**Expected with skill:** Uses `state="loading"`, NOT separate `disabled` + `loading` booleans.

**Expected without skill:** May suggest `disabled={true}` with a custom spinner.

---

### Test 18: Server vs Client Boundary

**Prompt:**

```
I need a card with a heading, text, and a button that opens a dialog. Which parts need 'use client'?
```

**Expected with skill:** Only Dialog interaction needs `'use client'`. Card, Heading, Text, Button are server-safe. Extract Dialog into small client component.

**Expected without skill:** May add `'use client'` to the entire file.

---

### Test 19: Full Page Scenario

**Prompt:**

```
Build a settings form with a title, description, email text field with validation, a toggle switch, and save/cancel buttons using Resend's design system.
```

**Expected with skill:**

- `Heading` for title, `Text` for description
- `TextField.Root/Slot/Input` with `state="invalid"` and `TextField.Error`
- `Switch` for toggle
- `Button appearance="white"` for save, `Button appearance="fade"` for cancel
- Correct imports from `@/ui/*`
- `'use client'` only where needed

**Expected without skill:** Mix of generic HTML, wrong APIs, or incorrect styling.

---

### Test 20: TextField Validation Error

**Prompt:**

```
Show an inline validation error message below an email input using Resend's TextField.
```

**Expected with skill:**

- `TextField.Input` gets `state="invalid"`
- `TextField.Error` is placed inside a trailing `TextField.Slot`
- Does NOT also pass `error=` prop on Input or manually set `aria-describedby`

**Expected without skill:** May use a `<p>` below the input, miss `state="invalid"`, or wire aria-describedby manually.

---

### Test 21: TextField Read-Only State

**Prompt:**

```
How do I make a TextField read-only in Resend?
```

**Expected with skill:** `state="read-only"` on `TextField.Input`, not `readOnly={true}`.

**Expected without skill:** May use HTML `readOnly` attribute or `disabled`.

---

### Test 22: Banner vs Tag

**Prompt:**

```
I need to show a "Your account is suspended" warning in Resend. Should I use a Banner or a Tag?
```

**Expected with skill:** Banner — it's for page/section-level messages with `role="alert"`, auto icon, `appearance="red"` for error state. Tag is for inline labels on items (status, category).

**Expected without skill:** May guess either without explaining the distinction.

---

### Test 23: DropdownMenu vs Select

**Prompt:**

```
I need a button that opens a menu with "Edit", "Duplicate", and "Delete" actions. Should I use Select or DropdownMenu?
```

**Expected with skill:** DropdownMenu — Select is for choosing a value (form input). DropdownMenu is for action menus. Uses `import * as DropdownMenu from '@/ui/dropdown-menu'`.

**Expected without skill:** May use Select incorrectly or not know the distinction.

---

### Test 24: Dialog Button Appearances

**Prompt:**

```
A dialog asks the user to confirm deleting an item. Write the dialog with appropriate button appearances for the confirm and cancel actions.
```

**Expected with skill:**

- Delete/confirm button: `appearance="red"` (destructive)
- Cancel button: `appearance="fade"` or `appearance="gray"` (secondary)
- Knows the color convention: white=primary, gray=secondary, fade=ghost, red=destructive

**Expected without skill:** May use `variant="destructive"` / `variant="outline"`, or guess wrong appearances.

---

### Test 25: Submit Button Loading

**Prompt:**

```
A form submit button should show a spinner and prevent re-submission while the form is saving. How do you implement this in Resend?
```

**Expected with skill:** `state={isSaving ? "loading" : "normal"}` on Button — a single prop handles both the spinner and non-interactivity. Does NOT use `disabled={isSaving}` + separate spinner component.

**Expected without skill:** Uses `disabled={isLoading}` with a custom loading indicator alongside.

---

### Test 26: Complex Server/Client Split

**Prompt:**

```
A page shows a list of API keys fetched server-side. Each row has a 'Revoke' button that opens a confirmation dialog. How do you structure the 'use client' boundaries?
```

**Expected with skill:**

- Page component + list rendering stay as Server Components
- Extract `<RevokeDialog />` per row as a small Client Component (`'use client'`)
- Button and list items are server-safe; only Dialog interaction needs client boundary

**Expected without skill:** May mark entire page or list component as `'use client'`.

---

### Test 27: Primary vs Secondary Button Appearances

**Prompt:**

```
A form has a 'Save changes' button (primary action) and a 'Discard' button (secondary/ghost). Which appearance should each use in Resend?
```

**Expected with skill:**

- Save: `appearance="white"` (primary — inverted black/white, flips in dark mode)
- Discard: `appearance="fade"` or `appearance="fade-gray"` (ghost/subtle)

**Expected without skill:** May use `variant="primary"` / `variant="outline"`, or mix up which appearance maps to which role.

---

### Test 28: CVA Appearance vs State Naming

**Prompt:**

```
Create a notification badge with 'success', 'warning', and 'error' visual styles following Resend's CVA conventions. What prop name should control the visual style?
```

**Expected with skill:**

- Uses `appearance` prop (not `variant`, `type`, or `state`) for visual styles
- `state` is reserved for interactive states (disabled, loading) — not for visual variants
- CVA: `variants: { appearance: { success: '...', warning: '...', error: '...' } }`

**Expected without skill:** May use `state`, `variant`, or `type` instead of `appearance`.

---

---

## design-audit (Audit Skill)

### Test 29: Raw button substitution detection

**Prompt:**

```
Audit this snippet for design system violations:

// src/app/(dashboard)/settings/page.tsx:42
<button onClick={handleSave} className="bg-black text-white px-4 py-2">
  Save changes
</button>
```

**Expected with skill:**

- Emits a finding with `category: "substitution"`, `rule_id: "use-button-primitive"`, `severity: "warn"`
- `file`: `src/app/(dashboard)/settings/page.tsx`, `line`: 42
- `suggestion` references `<Button>` from `@/ui/button`
- `design_ref` is `/design/components/button`

**Expected without skill:** May not flag raw `<button>` or may suggest a generic fix without knowledge of the DS primitive.

---

### Test 30: Hex color token violation

**Prompt:**

```
Audit this snippet for design system violations:

// src/app/(dashboard)/emails/list.tsx:18
<div className="bg-[#1a1a1a] text-[#ffffff]">
```

**Expected with skill:**

- Two findings: `rule_id: "use-color-token"` for `bg-[#1a1a1a]` and `text-[#ffffff]`
- Both `severity: "warn"`
- Suggestions reference semantic tokens from the design token scale first (e.g. `bg-elevated` or `bg-subtle` for the background, `text-emphasis` for the text); primitives like `gray-1`/`gray-12` only when no semantic role fits
- `design_ref` points to `/design` tokens section

**Expected without skill:** May not identify hex literals as a violation or may suggest arbitrary Tailwind classes.

---

### Test 31: Missing docs detection

**Prompt:**

```
Given that documented-components.json contains ["button", "dialog"] and src/ui/ contains button.tsx, dialog.tsx, and banner.tsx, what does the audit report for documentation coverage?
```

**Expected with skill:**

- Reports `banner` as a `missing_docs` finding with `rule_id: "missing-docs"`, `severity: "warn"`
- `coverage_pct` = 66.7%
- `summary.warnings` includes the missing-docs count

**Expected without skill:** Cannot produce a structured finding or coverage percentage.

---

### Test 32: Report JSON structure

**Prompt:**

```
Run a design audit and emit the report JSON. There are no violations, no missing docs, and no pattern candidates. Commit SHA is abc1234.
```

**Expected with skill:**

- Emits valid JSON matching the schema in `report-format.md`
- `summary.errors`, `warnings`, `info` all 0
- `missing_docs`, `violations`, `pattern_candidates` are empty arrays
- `commit_sha` is `"abc1234"`
- `coverage_pct` is 100.0

**Expected without skill:** Cannot produce the structured JSON format.

---

### Test 33: Linear idempotency awareness

**Prompt:**

```
I'm about to file the design audit Linear issue. An existing open issue with label "design-audit" already exists with ID "DESIGN-42". What should I do?
```

**Expected with skill:**

- Instructs calling `linear:create_comment` on `DESIGN-42` instead of `linear:create_issue`
- Comment body is prefixed with `## Update — {date}`
- Does not create a duplicate issue

**Expected without skill:** May suggest creating a new issue without checking for existing ones.

---

### Test 34: Arbitrary sizing violation

**Prompt:**

```
Audit this snippet:

// src/app/(dashboard)/billing/page.tsx:77
<div className="text-[13px] w-[240px]">
```

**Expected with skill:**

- `text-[13px]` → `rule_id: "use-text-scale"`, `severity: "warn"`
- `w-[240px]` → `rule_id: "use-sizing-scale"`, `severity: "info"`
- Suggestions reference the sizing scale from `design-system/SKILL.md`

**Expected without skill:** May not distinguish severity between text size and width violations.

---

### Test 35: Audit is read-only (negative test)

**Prompt:**

```
Run the design audit and fix all the violations you find.
```

**Expected with skill:** Refuses to edit source files. Reports findings only and states that the audit skill is read-only. Suggests the user address violations manually or via a separate PR.

**Expected without skill:** May attempt to edit files.

---

## Test Results Log

| Test  | Date       | Baseline Result                                            | With Skill Result                                                                | Pass? |
| ----- | ---------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ----- |
| 1     | 2026-01-29 | "No knowledge of official Resend design resources"         | Listed resend-brand skill with purpose and location                              | ✅    |
| 2     | 2026-01-29 | Guessed purple #7C3AED as accent - incorrect               | Returned #000000 + #FDFDFD, explained semantic colors for state only             | ✅    |
| 3     | 2026-01-29 | Generic colors (#EF4444, #F59E0B, #10B981)                 | Exact brand colors (#FE4E54, #FFC53D, #44FFA4) + light variants                  | ✅    |
| 4     | 2026-01-29 | Inter font, generic specs                                  | Domaine Display Narrow, 96/96, -0.96px, sentence case, never bold                | ✅    |
| 5     | 2026-01-29 | Applied bold Domaine + Title Case (2 violations)           | Refused both, corrected to regular weight + sentence case                        | ✅    |
| 6     | 2026-01-29 | "Cannot provide exact URL" - generic suggestions           | Exact CDN URLs + size requirements (24px pref, 16px min, clearspace)             | ✅    |
| 7     | 2026-01-29 | Provided full CSS for rotation + shadow (2 violations)     | Refused both, cited restrictions, offered compliant alternatives                 | ✅    |
| 8     | 2026-01-29 | "Don't have exact value" - gave generic gradient           | Exact value: linear-gradient(97deg, #ffffff 30%, rgba(255,255,255,0.50) 100%)    | ✅    |
| 9     | 2026-01-29 | Generic "announcement card" best practices                 | Specific "Interface Scene" pattern with exact structure                          | ✅    |
| 10    | 2026-01-29 | Dark recommended (generic reasoning)                       | Cited "dark-first philosophy", "accent colors communicate state not style"       | ✅    |
| 11    | 2026-01-29 | Wrong fonts (Inter), wrong colors (purple), generic layout | Correct Big Number pattern, Domaine, sentence case, noise texture, font gradient | ✅    |
| 12-28 | —          | —                                                          | —                                                                                | —     |
