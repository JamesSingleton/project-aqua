# Complementary information (tooltip, placeholder, label, drawer)

> Guideline, not a rule. Use this when a control needs *extra* explanation beyond its own label.

## The decision

You have a control (input, button, switch, table column header, etc.) and you want to say something *more* about it — the format it expects, why it's disabled, what units it's in, what happens when you toggle it, where to learn more. Where does that extra information go?

## The available surfaces

| Surface | Component | When the user sees it |
|---------|-----------|-----------------------|
| **Visible label** | Plain text above the control | Always |
| **Placeholder** | `placeholder=` on `TextField.Input` | Only when the input is empty |
| **Inline description** | Text node beside / under a `Switch`, `Checkbox`, or section header | Always |
| **TextField slot** | `<TextField.Slot>` before / after the input | Always (icon or short adornment) |
| **Tooltip** | `Tooltip` primitive on hover/focus | Only when the user actively hovers / focuses |
| **Field error** | `<TextField.Error>` inside a trailing slot | Only after validation fails |
| **Drawer / docs page** | `Drawer` or a linked doc page | Only when the user explicitly opens it |

## Principle

Pick the surface that matches how *necessary* and how *long* the information is.

- **Necessary to use the control at all** → it belongs in the visible label or an always-visible inline description.
- **Helpful but only sometimes** → tooltip or placeholder.
- **Long enough to be a paragraph** → linked drawer or doc page, not a tooltip.

## Quick chooser

| The extra info is… | Put it… |
|--------------------|---------|
| The control's name | Visible label (never beneath the field) |
| A one-line example of the expected format | `placeholder=` |
| A short explanation of what toggling will do | Inline description next to the `Switch` / `Checkbox` |
| An icon hint (search, currency, prefix domain) | `TextField.Slot` |
| A definition the user only needs occasionally | Tooltip — keep it to one short sentence |
| Why the field is disabled or invalid | Tooltip on hover, plus `TextField.Error` on submit |
| A paragraph of context, a screenshot, a list of cases | Drawer or a link to documentation |

## Specific rules

1. **Labels go above the field, never beneath.** A label under a `TextField` reads as helper text and gets lost when the field fills up.
2. **Placeholder is not a label.** It disappears the moment the user types. Use it for format hints (`name@example.com`, `prod-...`), not for the field's name.
3. **Tooltips are short.** If you need more than one short sentence, link to a doc instead of expanding the tooltip. Tooltips can't be selected, can't wrap nicely, and are invisible to touch users.
4. **Booleans get inline descriptions, not tooltips.** A `Switch` and a `Checkbox` should explain their effect inline, with one short line of helper text underneath.
5. **Drawers are for long, complementary content** — API references, change-log excerpts, schema docs. Reach for a drawer when the alternative would be a tooltip wall.
6. **Icons inside inputs go in `TextField.Slot`**, not as background images or absolutely positioned children. The slot system already adjusts input padding via ResizeObserver.
7. **Validation errors use `TextField.Error`**, not a free-floating `<p>` below the field. The primitive wires `aria-describedby` for you.

## Anti-patterns

- A wall-of-text tooltip the user can't scroll, select, or pin open.
- A `Switch` with no inline description — the user has to flip it to find out what it does.
- A `placeholder` that's the only naming of the field (no real label) — fails as soon as the user types.
- A label below the input as "helper text."
- An icon adornment positioned with `absolute` instead of `TextField.Slot`, fighting the input's padding.
- Tooltip used for a permanent piece of context the user always needs to read (move it to an inline description instead).

## Related

- [`button-appearance`](button-appearance.md) — every IconButton needs a tooltip; this file says how long it should be.
- [`affordance`](affordance.md) — the right complementary surface keeps the control's affordance honest.
- [`dialog-stepper-fullscreen-drawer`](dialog-stepper-fullscreen-drawer.md) — drawers are also a container choice, not just a complementary-content surface.
