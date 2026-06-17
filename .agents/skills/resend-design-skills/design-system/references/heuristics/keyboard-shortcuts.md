# Keyboard shortcuts

> Guideline, not a rule. Use this when adding a shortcut to a dialog, form, or global surface — show it where the action lives, wire it once, and never let it become the only way through.

## Principle

A shortcut is an accelerator layered on top of a control the user can already click. It speeds up the people who live in the dashboard; it never replaces the button. So two things have to be true at once: the action is reachable by mouse, *and* the keyboard path is visible on the control itself so a user can discover it without a cheat sheet.

Two halves make up every shortcut, and they live in different places:

- **The label** — a `Kbd` hint rendered on or beside the control, using platform-aware glyphs (`⌘` on Mac, `Ctrl` on Windows/Linux).
- **The handler** — the key actually wired up with `useHotkeys`, gated by the same condition that gates the control.

Keep the two in sync. A hint with no handler is a lie (see [`affordance`](affordance.md)); a handler with no hint is a secret.

## The building blocks

| Piece | Import | Use for |
|-------|--------|---------|
| `Kbd` | `@/ui/kbd` | Rendering a single key. Appearance auto-matches when used via Button; standalone defaults to `gray`. |
| `SHORTCUTS_VALUES` | `@/ui/kbd` | Platform-aware key constants: `CMD`, `CTRL`, `SHIFT`, `ALT`, `ENTER` (`↩`), `ESC` (`Esc`), `BACKSPACE` (`⌫`). Never hardcode the glyph. |
| `Button`'s `shortcut` prop | `@/ui/button` | The canonical way to put a hint on an action. Pass a string for one key, `[a, b]` for a chord. The Kbd appearance is derived from the button's appearance automatically. |
| `useHotkeys` | `react-hotkeys-hook` | Wiring the actual key handler. |
| `GlobalShortcuts` | `@/components/global-shortcuts` | App-wide single-key and `g`+letter navigation shortcuts. |

## Dialogs and forms — the canonical pattern

Every dialog with a primary action follows the same shape. **Cmd/Ctrl+Enter submits, Esc cancels.**

```tsx
// Wire the submit shortcut. enableOnFormTags lets it fire while the user
// is typing in the input; the guard mirrors the button's own state.
useHotkeys(
  'mod+enter',
  () => {
    if (!isPending && form.formState.isValid) onSubmit();
  },
  { enableOnFormTags: ['input'] },
  [isPending, form.formState.isValid, onSubmit],
);

// ...
<Button
  type="submit"
  state={isPending ? 'loading' : form.formState.isValid ? 'normal' : 'disabled'}
  shortcut={[SHORTCUTS_VALUES.CMD, SHORTCUTS_VALUES.ENTER]}
>
  Add
</Button>
<Dialog.Close asChild>
  <Button appearance="gray" shortcut={SHORTCUTS_VALUES.ESC}>
    Cancel
  </Button>
</Dialog.Close>
```

The rules that make this work:

1. **`'mod+enter'`, not `'cmd+enter'`.** `react-hotkeys-hook`'s `mod` resolves to Cmd on Mac and Ctrl elsewhere — the same split `SHORTCUTS_VALUES.CMD` shows. The handler string and the displayed hint are two halves of one shortcut; keep them paired.
2. **`enableOnFormTags: ['input']`.** By default hotkeys are suppressed while focus is in a field. Submit chords *must* fire while typing, so opt the input tag back in.
3. **Gate the handler exactly like the button.** If the button is `disabled`/`loading`, the shortcut must no-op too (`if (!isPending && form.formState.isValid)`). The accelerator never bypasses the gate — including a typed-confirmation guard on a destructive dialog.
4. **Don't re-wire Esc.** The `Dialog` primitive already closes on Escape, and `Dialog.Close` already handles the click. `shortcut={SHORTCUTS_VALUES.ESC}` on Cancel is *only a label*. Adding a `useHotkeys('esc', ...)` duplicates behaviour the primitive owns.
5. **Focus the primary input on open** (`autoFocus`, or `onOpenAutoFocus` + a ref) so typing and Cmd+Enter work the instant the dialog appears.

## Choosing the key

| Surface | Convention | Why |
|---------|-----------|-----|
| Action inside a form/dialog | Modifier chord — `mod+enter` to submit | Chords are safe to fire while the user is typing. |
| Dismiss a dialog | `Esc` (native) | Universal expectation; the primitive already does it. |
| Global navigation | `g` then a letter (`g e` → Emails, `g d` → Domains) | Sequences from `CMDK_NAVIGATION_ACTIONS`; won't collide with typing a single letter. |
| Global toggle | Bare single key (`m` theme, `d` docs) | Reserve these for app-wide actions, and only when no field/dialog is focused. |

## Scoping and conflicts

Single-key global shortcuts are dangerous near text input — `m` should toggle the theme on a list page but type "m" inside a dialog. `GlobalShortcuts` guards every global hotkey with `ignoreEventWhen`, which checks for an open `[role="dialog"]` (and the help route). Any new single-key global shortcut must respect the same guard. Chords inside a dialog don't need it — they can't be typed by accident.

## Displaying shortcuts

- **In a button:** use the `shortcut` prop. Don't hand-place a `<Kbd>` next to the label — you'll lose the automatic appearance matching and the desktop-only behaviour.
- **In a navigation / command-palette row:** render `<Kbd appearance="fade">` per key, right-aligned against the label.
- **Always desktop-only.** Button shortcut hints are `hidden md:flex` by design — there's no keyboard on touch. The hint is a bonus; the tap target is the real affordance. So a feature must never be reachable *only* by a shortcut.
- **Always `SHORTCUTS_VALUES`,** never a literal `⌘` or `"Ctrl"`, so Mac and Windows/Linux each see the right glyph.

## Anti-patterns

- Hardcoding `⌘` or `Ctrl` instead of `SHORTCUTS_VALUES.CMD`. Windows users then see the wrong key.
- Wiring `useHotkeys('esc', closeDialog)` when the `Dialog` already closes on Escape.
- A shortcut that fires while its button is disabled or loading — it must share the button's guard.
- A single-key global shortcut with no `ignoreEventWhen` guard, so it triggers while the user types in a dialog.
- Showing a `shortcut` hint for a key that was never wired up — a broken affordance.
- Hand-placing `<Kbd>` beside a `Button` instead of using the `shortcut` prop.
- An action that has a hotkey but no visible, clickable control.

## Related

- [`affordance`](affordance.md) — a shortcut hint is an affordance; it must match a handler that actually exists and is currently available.
