import type { RosterPageInput } from "@lane4hq/db/queries/roster";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

/** URL / search-param keys from `roster/search-params.ts` (firstName maps to `q`). */
export type RosterExportFilterParams = {
  firstName?: string;
  status?: string[];
  gender?: string[];
  groupId?: string[];
  classYear?: string[];
  sort?: { id: string; desc: boolean }[];
  seasonId?: string;
};

export function rosterSearchFiltersToExportInput(
  params: RosterExportFilterParams,
): RosterPageInput {
  const input: RosterPageInput = {};

  if (params.seasonId) {
    input.seasonId = params.seasonId;
  }

  const q = params.firstName?.trim();
  if (q) {
    input.q = q;
  }
  if (params.status?.length) {
    input.status = params.status;
  }
  if (params.gender?.length) {
    input.gender = params.gender;
  }
  if (params.groupId?.length) {
    input.groupId = params.groupId;
  }
  if (params.classYear?.length) {
    input.classYear = params.classYear;
  }
  if (params.sort?.length) {
    input.sort = params.sort;
  }

  return input;
}

function readColumnFilter<T>(
  columnFilters: ColumnFiltersState,
  id: string,
): T | undefined {
  const filter = columnFilters.find((entry) => entry.id === id);
  if (filter?.value === undefined || filter.value === "") {
    return undefined;
  }
  return filter.value as T;
}

export function rosterExportInputFromTableState(input: {
  columnFilters: ColumnFiltersState;
  sorting: SortingState;
  seasonId?: string;
}): RosterPageInput {
  return rosterSearchFiltersToExportInput({
    seasonId: input.seasonId,
    firstName: readColumnFilter<string>(input.columnFilters, "firstName"),
    status: readColumnFilter<string[]>(input.columnFilters, "status"),
    gender: readColumnFilter<string[]>(input.columnFilters, "gender"),
    groupId: readColumnFilter<string[]>(input.columnFilters, "groupId"),
    classYear: readColumnFilter<string[]>(input.columnFilters, "classYear"),
    sort:
      input.sorting.length > 0
        ? input.sorting.map(({ id, desc }) => ({ id, desc }))
        : undefined,
  });
}
