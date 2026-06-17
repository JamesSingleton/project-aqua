# Affordance

> Guideline, not a rule. Use this when reviewing whether a control looks the way it behaves.

## Working definition

> Affordances are the characteristics or properties of an object that suggest how it can be used. They show a user that an object can be interacted with.
>
> An affordance is not a "property" of an object — it lives in the relation between the user and the object. A door affords opening if you can reach the handle. For a toddler who can't reach the handle, the same door doesn't afford opening.

A good affordance keeps the visual signal and the actual behaviour in sync. A broken affordance lies — it looks interactive when it isn't, or hides interactivity behind something that looks inert.

## Principle

The user should be able to predict what happens before they click. If the UI suggests an action that won't work for this user, in this state, on this destination, the affordance is broken — fix the signal, don't add an apology afterwards.

## Three quick checks

1. **Does the control behave the way it looks?** A button that's styled as enabled but does nothing on click is dishonest. Either re-style (disabled, with reason) or actually wire the action up.
2. **Does the user know where the click will take them?** External links should look distinguishable from internal links. Open-in-new-tab should be visible before the click, not a surprise after.
3. **Is the visible state honest about availability?** Loading, disabled, read-only, and invalid states must look different from the resting state — and from each other.

## Common breakages

- A button labelled "Export" that's visibly active for non-admins, but actually no-ops or shows an error. → Disable it with a tooltip explaining the gate (see [`disable-vs-hide`](disable-vs-hide.md)).
- A disabled button that still runs a spinner or hover animation. → A disabled control should be visually inert.
- An icon that looks clickable but is decorative, or a span of text that's clickable but looks like body copy. → Use the `Button` / `IconButton` / `Link` primitives so affordance comes from the component.
- External links styled identically to internal links. → Differentiate visually (e.g. trailing arrow icon, distinct hover) so the user predicts the tab switch.
- A "Save" button that stays the same on submit so the user clicks twice. → Switch to `state="loading"` (see the design-system SKILL — `state` already prevents interaction).

## How to apply this in review

When auditing a screen, ask one question per interactive element:

| Question | If "no" |
|----------|---------|
| Does it look like what it does? | Re-style or re-wire. |
| Will the user predict where the click goes? | Add an icon, label, or hover cue. |
| Does the disabled state explain itself? | Add a tooltip or inline reason. |
| Does an animation only fire when the action is actually available? | Remove animation from disabled / read-only states. |

## Related

- [`disable-vs-hide`](disable-vs-hide.md) — honest disabling is the most common affordance fix.
- [`button-appearance`](button-appearance.md) — using the right appearance is part of giving an action the right affordance.
