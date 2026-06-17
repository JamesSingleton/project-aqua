# Component Catalog

Full API reference for all `src/ui/` primitives. Import with `@/ui/{name}`.

## Button

```tsx
import { Button } from '@/ui/button';
<Button appearance="white" size="2" state="loading" iconLeft={<IconPlus />} shortcut="⌘S">Save</Button>
```

| Prop | Type | Default |
|------|------|---------|
| `appearance` | `'white' \| 'gray' \| 'fade-gray' \| 'fade' \| 'fade-red' \| 'red'` | `'white'` |
| `size` | `'1' \| '2'` | `'2'` |
| `state` | `'normal' \| 'disabled' \| 'loading'` | — |
| `iconLeft` / `iconRight` | `ReactElement` | — |
| `shortcut` | `string \| [string, string]` | — |
| `asChild` | `boolean` | `false` |

## IconButton

Same variants as Button. Always provide `aria-label`.

```tsx
import { IconButton } from '@/ui/icon-button';
<IconButton appearance="fade" size="1" aria-label="Close"><IconClose /></IconButton>
```

## TextField

Compound component. Always wrap in `TextField.Root`.

```tsx
import { TextField } from '@/ui/text-field/text-field';

<TextField.Root>
  <TextField.Slot><IconSearch /></TextField.Slot>
  <TextField.Input placeholder="Search..." size="2" />
  <TextField.Slot>
    <TextField.Error message="Required" id="field-error" />
  </TextField.Slot>
</TextField.Root>
```

**Input props:** `size` 1|2|3, `appearance` gray|public, `state` normal|disabled|read-only|invalid, `error` string.
Slots auto-adjust input padding via ResizeObserver. Max one slot before Input, one after.

## Heading

```tsx
import { Heading } from '@/ui/heading';
<Heading as="h2" size="5" color="white" weight="semibold">Title</Heading>
```

`as` h1-h6. `size` 1-8 (7-8 use `font-display`). `color` white|gray. `weight` medium|semibold|bold.

## Text

```tsx
import { Text } from '@/ui/text';
<Text as="p" size="2" color="gray">Description</Text>
```

`as` span|p|strong. `size` 1-9. `color` white|gray|red|yellow. `weight` normal|medium|semibold|bold.

## Tag

```tsx
import { Tag } from '@/ui/tag';
<Tag appearance="green" variant="solid" size="1">Active</Tag>
```

`appearance` gray|dimgray|green|red|yellow|blue|orange|violet|sand. `variant` solid|outline. `size` 1|2.

## Banner

```tsx
import { Banner } from '@/ui/banner';
<Banner appearance="yellow" size="2">Warning message</Banner>
```

`appearance` gray|green|red|yellow|blue. `size` 1|2. Auto icon: blue/gray=Info, green=Confetti, red/yellow=Warning.

## Select

```tsx
import * as Select from '@/ui/select';

<Select.Root value={val} onValueChange={setVal}>
  <Select.Trigger size="2" appearance="gray" />
  <Select.Content>
    <Select.Label>Group</Select.Label>
    <Select.Item value="a">Option A</Select.Item>
    <Select.Separator />
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select.Root>
```

Trigger: `size` 1|2, `appearance` gray|ghost, `state` normal|invalid.

## Dialog

```tsx
import * as Dialog from '@/ui/dialog';

<Dialog.Root>
  <Dialog.Trigger asChild><Button>Open</Button></Dialog.Trigger>
  <Dialog.Content size="1">
    <Dialog.Title>Confirm</Dialog.Title>
    <p>Are you sure?</p>
  </Dialog.Content>
</Dialog.Root>
```

Content `size`: 1 (max-w-lg), 2 (1200px), full-screen (80vw/80vh). `includeCloseButton` defaults true.

## Switch & Checkbox

```tsx
import { Switch } from '@/ui/switch';
<Switch checked={on} onCheckedChange={setOn} disabled={false} />

import { Checkbox } from '@/ui/checkbox';
<Checkbox checked={val} onCheckedChange={setVal} />  // supports 'indeterminate'
```

## Tooltip

```tsx
import * as Tooltip from '@/ui/tooltip';
<Tooltip.Root>
  <Tooltip.Trigger asChild><Button>Hover</Button></Tooltip.Trigger>
  <Tooltip.Content>Tip text</Tooltip.Content>
</Tooltip.Root>
```

## Other Components

| Component | Import | Notes |
|-----------|--------|-------|
| Avatar | `@/ui/avatar` | Compound: Root, Image, Fallback. `variant` rounded\|squared |
| Tabs | `@/ui/tabs` | Namespace: Root, List, Trigger, Content |
| Kbd | `@/ui/kbd` | `appearance` gray\|inverted\|red\|fade\|fade-gray |
| DropdownMenu | `@/ui/dropdown-menu` | Namespace: Root, Trigger, Content, Item, Separator |
| Drawer | `@/ui/drawer` | Side drawer overlay |
| Popover | `@/ui/popover` | Popover overlay |
| ContextMenu | `@/ui/context-menu` | Right-click menu |
| Skeleton | `@/ui/skeleton` | Loading placeholder |
| LoadingDots | `@/ui/loading-dots` | Animated loader |
| CopyButton | `@/ui/copy-button` | One-click copy |
| EmptyState | `@/ui/empty-state` | Empty state placeholder |
| Card | `@/ui/card` | Card container |
| Pagination | `@/ui/pagination` | Page navigation |
| Breadcrumb | `@/ui/breadcrumb` | Breadcrumb trail |
| Link | `@/ui/link` | Styled link |
| InternalLink | `@/ui/internal-link` | App navigation link |
| Calendar | `@/ui/calendar` | Date picker |
| Collapsible | `@/ui/collapsible` | Expandable section |
| ScrollArea | `@/ui/scroll-area` | Custom scrollbar |
| BulkActions | `@/ui/bulk-actions` | Compound: Root, BottomBar, CheckBoxItem, SelectAll |
| ToggleGroup | `@/ui/toggle-group` | Radio/multi-select group |
| SensitiveField | `@/ui/sensitive-field` | Masked sensitive data |

## Icons

100+ icons in `@/ui/icons/icon-{name}.tsx`. Common: IconClose, IconCheck, IconCheckmark, IconSearch, IconChevronDown/Up/Left/Right, IconPlus, IconMinus, IconTrash, IconEdit, IconInformation, IconWarning, IconConfetti, IconCopy, IconExternalLink, IconSettings.

Live examples at `src/app/(internal)/design/components/{name}/page.tsx`.
