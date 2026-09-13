"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@project-aqua/ui/components/combobox";
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type SeasonOption,
  SeasonSelector,
} from "@/components/roster/season-selector";
import {
  formatSwimmerLastFirst,
  type ProgressionSwimmer,
  sortProgressionSwimmers,
} from "./progression-swimmers";

const ALL_GROUPS = "__all__";
const NO_GROUP = "__none__";

type SwimmerOption = {
  id: string;
  label: string;
  groupName: string | null;
};

function filterByGroup(
  swimmers: ProgressionSwimmer[],
  groupKey: string,
): ProgressionSwimmer[] {
  if (groupKey === ALL_GROUPS) return swimmers;
  if (groupKey === NO_GROUP) {
    return swimmers.filter((s) => !s.groupName);
  }
  return swimmers.filter((s) => s.groupName === groupKey);
}

function toOption(swimmer: ProgressionSwimmer): SwimmerOption {
  return {
    id: swimmer.swimmerId,
    label: formatSwimmerLastFirst(swimmer),
    groupName: swimmer.groupName,
  };
}

export function ProgressionSwimmerPicker({
  teamId,
  swimmers,
  selectedId,
  seasonParam,
  seasons,
  selectedSeasonId,
}: {
  teamId: string;
  swimmers: ProgressionSwimmer[];
  selectedId?: string;
  /** Preserve `?season=` when switching swimmers. */
  seasonParam?: string;
  seasons: SeasonOption[];
  selectedSeasonId: string;
}) {
  const router = useRouter();
  const [groupKey, setGroupKey] = useState(ALL_GROUPS);

  const sorted = useMemo(() => sortProgressionSwimmers(swimmers), [swimmers]);

  const seasonQuery =
    seasonParam && seasonParam.length > 0
      ? `?season=${encodeURIComponent(seasonParam)}`
      : "";

  function progressionHref(swimmerId: string) {
    return `/team/${teamId}/progression/${swimmerId}${seasonQuery}`;
  }

  const groupOptions = useMemo(() => {
    const names = new Set<string>();
    let hasUngrouped = false;
    for (const s of sorted) {
      if (s.groupName) names.add(s.groupName);
      else hasUngrouped = true;
    }
    const items = [
      { value: ALL_GROUPS, label: "All groups" },
      ...[...names]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
        .map((name) => ({ value: name, label: name })),
    ];
    if (hasUngrouped) {
      items.push({ value: NO_GROUP, label: "No group" });
    }
    return items;
  }, [sorted]);

  const filtered = useMemo(
    () => filterByGroup(sorted, groupKey),
    [sorted, groupKey],
  );

  const selectedSwimmer =
    sorted.find((s) => s.swimmerId === selectedId) ?? null;

  const items = useMemo(() => {
    const options = filtered.map(toOption);
    if (
      selectedSwimmer &&
      !options.some((option) => option.id === selectedSwimmer.swimmerId)
    ) {
      return [toOption(selectedSwimmer), ...options];
    }
    return options;
  }, [filtered, selectedSwimmer]);

  const selected = items.find((option) => option.id === selectedId) ?? null;

  // If the current swimmer falls outside the group filter, jump to the first match.
  useEffect(() => {
    if (filtered.length === 0) return;
    if (selectedId && filtered.some((s) => s.swimmerId === selectedId)) return;
    const first = filtered[0];
    if (!first || first.swimmerId === selectedId) return;
    router.replace(progressionHref(first.swimmerId));
  }, [filtered, selectedId, teamId, router, seasonQuery]);

  function goToSwimmer(swimmerId: string) {
    if (swimmerId === selectedId) return;
    router.push(progressionHref(swimmerId));
  }

  function onGroupChange(value: string | null) {
    if (value == null) return;
    setGroupKey(value);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="progression-season">Season</Label>
        <SeasonSelector
          teamId={teamId}
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          allowAll
          triggerId="progression-season"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="progression-group">Group</Label>
        <Select
          items={groupOptions}
          value={groupKey}
          onValueChange={onGroupChange}
        >
          <SelectTrigger id="progression-group" className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {groupOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-md">
        <Label htmlFor="progression-swimmer">Swimmer</Label>
        <Combobox
          items={items}
          value={selected}
          onValueChange={(item) => {
            if (item) goToSwimmer(item.id);
          }}
          itemToStringValue={(item) => item.label}
          itemToStringLabel={(item) => item.label}
          isItemEqualToValue={(item, current) => item.id === current.id}
          disabled={filtered.length === 0}
        >
          <ComboboxInput
            id="progression-swimmer"
            className="w-full"
            placeholder={
              filtered.length === 0 ? "No swimmers in group" : "Select swimmer…"
            }
            disabled={filtered.length === 0}
          />
          <ComboboxContent>
            <ComboboxEmpty>No swimmers found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.id} value={item}>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.groupName && groupKey === ALL_GROUPS ? (
                      <span className="text-muted-foreground truncate text-xs">
                        {item.groupName}
                      </span>
                    ) : null}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}
