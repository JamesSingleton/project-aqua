"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@project-aqua/ui/components/combobox";

export type LabeledComboboxItem = {
  value: string;
  label: string;
};

export function LabeledCombobox({
  id,
  items,
  value,
  onChange,
  placeholder,
  emptyText = "No results.",
  disabled,
  showClear = true,
  className,
}: {
  id?: string;
  items: LabeledComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  showClear?: boolean;
  className?: string;
}) {
  const selected = items.find((item) => item.value === value) ?? null;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(item) => onChange(item?.value ?? "")}
      itemToStringValue={(item) => item.label}
      isItemEqualToValue={(item, current) => item.value === current.value}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        className={className ?? "w-full"}
        placeholder={placeholder}
        disabled={disabled}
        showClear={showClear}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
