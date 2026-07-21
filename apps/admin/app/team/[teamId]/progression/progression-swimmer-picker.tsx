"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@project-aqua/ui/components/command";
import { Label } from "@project-aqua/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { cn } from "@project-aqua/ui/lib/utils";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
  const [swimmerOpen, setSwimmerOpen] = useState(false);

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

  const selected = sorted.find((s) => s.swimmerId === selectedId);

  // If the current swimmer falls outside the group filter, jump to the first match.
  useEffect(() => {
    if (filtered.length === 0) return;
    if (selectedId && filtered.some((s) => s.swimmerId === selectedId)) return;
    const first = filtered[0];
    if (!first || first.swimmerId === selectedId) return;
    router.replace(progressionHref(first.swimmerId));
  }, [filtered, selectedId, teamId, router, seasonQuery]);

  function goToSwimmer(swimmerId: string) {
    setSwimmerOpen(false);
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
        <Popover open={swimmerOpen} onOpenChange={setSwimmerOpen}>
          <PopoverTrigger
            render={
              <Button
                id="progression-swimmer"
                variant="outline"
                role="combobox"
                aria-expanded={swimmerOpen}
                className="w-full justify-between font-normal"
                disabled={filtered.length === 0}
              />
            }
          >
            <span className="truncate">
              {selected
                ? formatSwimmerLastFirst(selected)
                : filtered.length === 0
                  ? "No swimmers in group"
                  : "Select swimmer…"}
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--anchor-width)] p-0 sm:w-[320px]"
          >
            <Command>
              <CommandInput placeholder="Search swimmers…" />
              <CommandList>
                <CommandEmpty>No swimmers found.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((s) => {
                    const label = formatSwimmerLastFirst(s);
                    const isSelected = s.swimmerId === selectedId;
                    return (
                      <CommandItem
                        key={s.swimmerId}
                        value={`${s.lastName} ${s.firstName} ${s.preferredName ?? ""} ${s.groupName ?? ""}`}
                        onSelect={() => goToSwimmer(s.swimmerId)}
                      >
                        <CheckIcon
                          className={cn(
                            "size-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{label}</span>
                          {s.groupName && groupKey === ALL_GROUPS ? (
                            <span className="text-muted-foreground truncate text-xs">
                              {s.groupName}
                            </span>
                          ) : null}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
