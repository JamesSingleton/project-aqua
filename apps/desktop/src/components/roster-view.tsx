import { Badge } from "@lane4hq/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@lane4hq/ui/components/table";
import { useDeferredValue, useState } from "react";
import type { InspectedFiles } from "../lib/meet-file";
import { FilterInput, matchesFilter } from "./filter-input";
import { Stat } from "./stat";

type RosterInspection = Extract<InspectedFiles, { kind: "roster" }>;

export function RosterView({ inspected }: { inspected: RosterInspection }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const rows = inspected.rows.filter((r) =>
    matchesFilter(
      deferredQuery,
      r.firstName,
      r.lastName,
      r.preferredName,
      r.usaMemberId,
      r.practiceGroup,
    ),
  );
  const female = inspected.rows.filter((r) => r.gender === "female").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Team roster</h1>
          <Badge variant="secondary">roster</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          This is a Team Manager roster export, not a meet pack.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {inspected.filenames.map((name) => (
            <Badge key={name} variant="outline" className="font-mono">
              {name}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:w-fit">
        <Stat label="Swimmers" value={inspected.rows.length} />
        <Stat label="Female" value={female} />
        <Stat label="Male" value={inspected.rows.length - female} />
      </section>

      <div className="flex justify-end">
        <FilterInput
          value={query}
          onChange={setQuery}
          placeholder="Filter by name or USA ID"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Birth date</TableHead>
            <TableHead>USA Swimming ID</TableHead>
            <TableHead>Group</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={`${row.lastName}-${row.firstName}-${row.dateOfBirth}-${i}`}
            >
              <TableCell className="font-medium">
                {row.lastName}, {row.preferredName ?? row.firstName}
              </TableCell>
              <TableCell className="capitalize">{row.gender}</TableCell>
              <TableCell className="font-mono tabular-nums">
                {row.dateOfBirth}
              </TableCell>
              <TableCell className="font-mono">
                {row.usaMemberId ?? "—"}
              </TableCell>
              <TableCell>{row.practiceGroup ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
