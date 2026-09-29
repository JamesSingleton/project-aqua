import { Alert, AlertDescription } from "@lane4hq/ui/components/alert";
import { Badge } from "@lane4hq/ui/components/badge";
import { Button } from "@lane4hq/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@lane4hq/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@lane4hq/ui/components/tabs";
import { CircleCheck, FolderOpen, TriangleAlert } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import {
  DIFF_SECTIONS,
  type DiffRow,
  type DiffSection,
  diffMeets,
  hasDifferences,
  type MeetDiff,
  type SectionDiff,
} from "../lib/meet-diff";
import type { MeetInspection } from "../lib/meet-file";
import { FilterInput, matchesFilter } from "./filter-input";

export type CompareSlotName = "original" | "candidate";

export type CompareSlot = { inspected?: MeetInspection; error?: string };

const SLOT_TITLES: Record<CompareSlotName, string> = {
  original: "Original",
  candidate: "Lane4 export",
};

const SECTION_TITLES: Record<DiffSection, string> = {
  events: "Events",
  entries: "Entries",
  results: "Results",
  relays: "Relays",
};

const ROW = "[content-visibility:auto] [contain-intrinsic-size:auto_2.5rem]";

export function CompareView({
  original,
  candidate,
  disabled,
  onChoose,
}: {
  original: CompareSlot;
  candidate: CompareSlot;
  disabled: boolean;
  onChoose: (slot: CompareSlotName) => void;
}) {
  const diff = useMemo(
    () =>
      original.inspected && candidate.inspected
        ? diffMeets(original.inspected.meet, candidate.inspected.meet)
        : null,
    [original.inspected, candidate.inspected],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Compare meets</h1>
        <p className="text-sm text-muted-foreground">
          Check a Lane4 export against the file it came from. Rows are matched
          by event, swimmer, and team; times are compared after normalizing.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <SlotCard
          name="original"
          slot={original}
          disabled={disabled}
          onChoose={onChoose}
        />
        <SlotCard
          name="candidate"
          slot={candidate}
          disabled={disabled}
          onChoose={onChoose}
        />
      </section>

      {diff ? <DiffResults diff={diff} /> : null}
    </div>
  );
}

function SlotCard({
  name,
  slot,
  disabled,
  onChoose,
}: {
  name: CompareSlotName;
  slot: CompareSlot;
  disabled: boolean;
  onChoose: (slot: CompareSlotName) => void;
}) {
  const { inspected, error } = slot;
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {SLOT_TITLES[name]}
          </span>
          <span className="truncate font-medium">
            {inspected
              ? inspected.meet.name || "Untitled meet"
              : "No files chosen"}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onChoose(name)}
        >
          <FolderOpen />
          Choose files…
        </Button>
      </div>
      {inspected ? (
        <div className="flex flex-wrap gap-1.5">
          {inspected.sourceFiles.map((file) => (
            <Badge key={file} variant="outline" className="font-mono">
              {file}
            </Badge>
          ))}
        </div>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function DiffResults({ diff }: { diff: MeetDiff }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const firstWithRows =
    DIFF_SECTIONS.find((section) => diff[section].rows.length > 0) ?? "events";

  if (!hasDifferences(diff)) {
    return (
      <>
        <CountsTable diff={diff} />
        <Alert>
          <CircleCheck />
          <AlertDescription>
            No differences. Every event, entry, result, and relay matches.
          </AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <>
      <CountsTable diff={diff} />
      <Tabs defaultValue={firstWithRows}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            {DIFF_SECTIONS.map((section) => (
              <TabsTrigger key={section} value={section}>
                {SECTION_TITLES[section]}
                <span className="ml-1.5 font-mono text-xs text-muted-foreground tabular-nums">
                  {diff[section].rows.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <FilterInput
            value={query}
            onChange={setQuery}
            placeholder="Filter by name, event, field"
          />
        </div>
        {DIFF_SECTIONS.map((section) => (
          <TabsContent key={section} value={section}>
            <DiffTable rows={diff[section].rows} query={deferredQuery} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function countByStatus(section: SectionDiff) {
  const counts = { missing: 0, extra: 0, changed: 0 };
  for (const row of section.rows) counts[row.status] += 1;
  return counts;
}

function CountCell({ value, tone }: { value: number; tone?: string }) {
  return (
    <TableCell
      className={`text-right font-mono tabular-nums ${value > 0 && tone ? tone : ""}`}
    >
      {value}
    </TableCell>
  );
}

function CountsTable({ diff }: { diff: MeetDiff }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Section</TableHead>
          <TableHead className="text-right">{SLOT_TITLES.original}</TableHead>
          <TableHead className="text-right">{SLOT_TITLES.candidate}</TableHead>
          <TableHead className="text-right">Matched</TableHead>
          <TableHead className="text-right">Missing</TableHead>
          <TableHead className="text-right">Extra</TableHead>
          <TableHead className="text-right">Changed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DIFF_SECTIONS.map((section) => {
          const counts = countByStatus(diff[section]);
          return (
            <TableRow key={section}>
              <TableCell className="font-medium">
                {SECTION_TITLES[section]}
              </TableCell>
              <CountCell value={diff[section].original} />
              <CountCell value={diff[section].candidate} />
              <CountCell value={diff[section].matched} />
              <CountCell value={counts.missing} tone="text-destructive" />
              <CountCell value={counts.extra} tone="text-destructive" />
              <CountCell value={counts.changed} tone="text-destructive" />
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

const STATUS_LABELS: Record<DiffRow["status"], string> = {
  missing: "Missing",
  extra: "Extra",
  changed: "Changed",
};

const STATUS_HINTS: Record<DiffRow["status"], string> = {
  missing: "In the original, not in the export",
  extra: "In the export, not in the original",
  changed: "",
};

function DiffTable({ rows, query }: { rows: DiffRow[]; query: string }) {
  const visible = rows.filter((row) =>
    matchesFilter(
      query,
      row.label,
      row.status,
      ...(row.status === "changed" ? row.changes.map((c) => c.field) : []),
    ),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Status</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Difference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="py-8 text-center text-muted-foreground"
            >
              {rows.length === 0
                ? "No differences in this section."
                : "No differences match the filter."}
            </TableCell>
          </TableRow>
        ) : null}
        {visible.map((row, i) => (
          <TableRow key={`${row.status}-${row.key}-${i}`} className={ROW}>
            <TableCell>
              <Badge
                variant={row.status === "changed" ? "secondary" : "destructive"}
              >
                {STATUS_LABELS[row.status]}
              </Badge>
            </TableCell>
            <TableCell className="font-medium whitespace-normal">
              {row.label}
            </TableCell>
            <TableCell className="whitespace-normal">
              {row.status === "changed" ? (
                <ul className="flex flex-col gap-0.5">
                  {row.changes.map((change) => (
                    <li key={change.field} className="text-sm">
                      <span className="text-muted-foreground">
                        {change.field}:
                      </span>{" "}
                      <span className="font-mono">{change.original}</span>
                      {" → "}
                      <span className="font-mono">{change.candidate}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {STATUS_HINTS[row.status]}
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
