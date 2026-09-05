"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@project-aqua/ui/components/combobox";
import { useMemo } from "react";

export type RelaySwimmerOption = {
  membershipId: string;
  label: string;
  blocked?: string | null;
};

const UNASSIGNED: RelaySwimmerOption = {
  membershipId: "",
  label: "Unassigned",
};

/** Last name, then first, from `First Last` or `First Last · 1:12.50`. */
function lastNameSortKey(label: string): string {
  const name = label.split("·")[0]?.trim() ?? "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.toLowerCase();
  return `${parts.slice(1).join(" ")} ${parts[0]}`.toLowerCase();
}

export function RelaySwimmerCombobox({
  label,
  value,
  displayValue,
  disabled,
  options,
  onChange,
}: {
  label: string;
  value: string;
  displayValue: string;
  disabled?: boolean;
  options: RelaySwimmerOption[];
  onChange: (membershipId: string) => void;
}) {
  const items = useMemo(() => {
    const named = [...options];
    if (value && !named.some((option) => option.membershipId === value)) {
      named.push({ membershipId: value, label: displayValue });
    }
    named.sort((a, b) =>
      lastNameSortKey(a.label).localeCompare(
        lastNameSortKey(b.label),
        undefined,
        {
          sensitivity: "base",
        },
      ),
    );
    return [UNASSIGNED, ...named];
  }, [displayValue, options, value]);

  const selected =
    items.find((option) => option.membershipId === value) ?? UNASSIGNED;

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(item) => onChange(item?.membershipId ?? "")}
      itemToStringValue={(item) => item.label}
      isItemEqualToValue={(item, current) =>
        item.membershipId === current.membershipId
      }
      disabled={disabled}
    >
      <ComboboxInput
        className="w-full"
        placeholder="Search swimmers…"
        aria-label={label}
        disabled={disabled}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>No swimmers found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => {
            const blocked = item.blocked != null;
            const isCurrent = item.membershipId === value;
            return (
              <ComboboxItem
                key={item.membershipId || "unassigned"}
                value={item}
                disabled={blocked && !isCurrent}
              >
                {item.label}
                {blocked ? " · at relay limit" : ""}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
