"use client";

import { Badge } from "@project-aqua/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { parseAsString, useQueryState } from "nuqs";

export type SeasonOption = {
  id: string;
  label: string;
  isCurrent: boolean;
};

const ALL_SEASONS = "__all__";

export function SeasonSelector({
  seasons,
  selectedSeasonId,
  allowAll = false,
  triggerId,
}: {
  teamId: string;
  seasons: SeasonOption[];
  /** Season id, or `"all"` when allowAll and viewing career. */
  selectedSeasonId: string;
  /** When true, includes an “All seasons” option (value `all` in the URL). */
  allowAll?: boolean;
  triggerId?: string;
}) {
  const [, setSeason] = useQueryState(
    "season",
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );

  const selectValue =
    selectedSeasonId === "all" && allowAll ? ALL_SEASONS : selectedSeasonId;

  const items = [
    ...(allowAll ? [{ value: ALL_SEASONS, label: "All seasons" }] : []),
    ...seasons.map((s) => ({
      value: s.id,
      label: s.label,
    })),
  ];

  return (
    <Select
      items={items}
      value={selectValue}
      onValueChange={(value) => {
        if (value == null) return;
        if (allowAll && value === ALL_SEASONS) {
          void setSeason("all");
          return;
        }
        const season = seasons.find((s) => s.id === value);
        void setSeason(season?.isCurrent ? "" : value);
      }}
    >
      <SelectTrigger
        id={triggerId}
        className="w-full sm:w-[220px]"
        aria-label="Season"
      >
        <SelectValue placeholder="Select season" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allowAll ? (
            <SelectItem value={ALL_SEASONS}>All seasons</SelectItem>
          ) : null}
          {seasons.map((season) => (
            <SelectItem key={season.id} value={season.id}>
              <span className="flex items-center gap-2">
                {season.label}
                {season.isCurrent ? (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                ) : null}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
