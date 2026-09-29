import type { ParsedMeet } from "@lane4hq/swim-formats";
import { Badge } from "@lane4hq/ui/components/badge";
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
import { useDeferredValue, useMemo, useState } from "react";
import type { InspectedFiles } from "../lib/meet-file";
import {
  eventLabel,
  eventLabelsByNumber,
  formatDateRange,
} from "../lib/meet-labels";
import { FilterInput, matchesFilter } from "./filter-input";
import { Stat } from "./stat";

type MeetInspection = Extract<InspectedFiles, { kind: "meet" }>;

const ROW = "[content-visibility:auto] [contain-intrinsic-size:auto_2.5rem]";

export function MeetView({ inspected }: { inspected: MeetInspection }) {
  const { meet, summary, sourceFiles } = inspected;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const labels = useMemo(() => eventLabelsByNumber(meet.events), [meet]);
  const dates = formatDateRange(meet.startDate, meet.endDate);
  const defaultTab =
    summary.results > 0
      ? "results"
      : summary.entries > 0
        ? "entries"
        : "events";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {meet.name || "Untitled meet"}
          </h1>
          <Badge variant="outline">{meet.course}</Badge>
          {meet.importKind ? (
            <Badge variant="secondary">{meet.importKind}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {[
            dates,
            meet.location,
            meet.sanctionNumber && `Sanction ${meet.sanctionNumber}`,
          ]
            .filter(Boolean)
            .join(" · ") || "No date or location in file"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {sourceFiles.map((name) => (
            <Badge key={name} variant="outline" className="font-mono">
              {name}
            </Badge>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Events" value={summary.events} />
        <Stat label="Entries" value={summary.entries} />
        <Stat label="Results" value={summary.results} />
        <Stat label="Relays" value={summary.relays} />
        <Stat label="Athletes" value={summary.athletes} />
        <Stat label="Teams" value={summary.teams.length} />
      </section>

      {meet.skippedDiveEvents ? (
        <p className="text-sm text-muted-foreground">
          {meet.skippedDiveEvents} diving event(s) in the file were skipped.
        </p>
      ) : null}

      <Tabs defaultValue={defaultTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="entries">Entries</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="relays">Relays</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <FilterInput
            value={query}
            onChange={setQuery}
            placeholder="Filter by name, event, team"
          />
        </div>
        <TabsContent value="entries">
          <EntriesTable meet={meet} labels={labels} query={deferredQuery} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTable meet={meet} labels={labels} query={deferredQuery} />
        </TabsContent>
        <TabsContent value="relays">
          <RelaysTable meet={meet} labels={labels} query={deferredQuery} />
        </TabsContent>
        <TabsContent value="events">
          <EventsTable meet={meet} query={deferredQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type TableProps = {
  meet: ParsedMeet;
  labels: Map<number, string>;
  query: string;
};

function eventCell(labels: Map<number, string>, eventNumber?: number) {
  if (eventNumber == null) return "—";
  const label = labels.get(eventNumber);
  return label ? `#${eventNumber} ${label}` : `#${eventNumber}`;
}

function NoRows({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-8 text-center text-muted-foreground"
      >
        Nothing here in this file.
      </TableCell>
    </TableRow>
  );
}

function EntriesTable({ meet, labels, query }: TableProps) {
  const rows = meet.entries.filter((e) =>
    matchesFilter(
      query,
      e.swimmerName,
      labels.get(e.eventNumber ?? -1),
      e.eventNumber,
    ),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Swimmer</TableHead>
          <TableHead>Seed</TableHead>
          <TableHead className="text-right">Heat / Lane</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? <NoRows colSpan={4} /> : null}
        {rows.map((entry, i) => (
          <TableRow
            key={`${entry.eventNumber}-${entry.swimmerName}-${i}`}
            className={ROW}
          >
            <TableCell>{eventCell(labels, entry.eventNumber)}</TableCell>
            <TableCell className="font-medium">
              {entry.swimmerName}
              {entry.exhibition ? (
                <Badge variant="outline" className="ml-2">
                  X
                </Badge>
              ) : null}
            </TableCell>
            <TableCell className="font-mono tabular-nums">
              {entry.seedTime ?? "NT"}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {entry.heat != null
                ? `${entry.heat} / ${entry.lane ?? "—"}`
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ResultsTable({ meet, labels, query }: TableProps) {
  const rows = meet.results.filter((r) =>
    matchesFilter(
      query,
      r.swimmerName,
      r.teamCode,
      labels.get(r.eventNumber ?? -1),
      r.eventNumber,
    ),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead className="text-right">Place</TableHead>
          <TableHead>Swimmer</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Round</TableHead>
          <TableHead className="text-right">Time</TableHead>
          <TableHead className="text-right">Splits</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? <NoRows colSpan={7} /> : null}
        {rows.map((result, i) => (
          <TableRow
            key={`${result.eventNumber}-${result.swimmerName}-${result.resultType}-${i}`}
            className={ROW}
          >
            <TableCell>{eventCell(labels, result.eventNumber)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {result.place ?? "—"}
            </TableCell>
            <TableCell className="font-medium">{result.swimmerName}</TableCell>
            <TableCell>{result.teamCode ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {result.resultType ?? "—"}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {result.isDq ? (
                <Badge variant="destructive">DQ {result.dqCode ?? ""}</Badge>
              ) : (
                result.time
              )}
            </TableCell>
            <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
              {result.splitsMs?.length ?? 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RelaysTable({ meet, labels, query }: TableProps) {
  const rows = (meet.relays ?? []).filter((r) =>
    matchesFilter(
      query,
      r.teamCode,
      labels.get(r.eventNumber ?? -1),
      r.eventNumber,
      ...r.swimmerNames,
    ),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Swimmers</TableHead>
          <TableHead>Seed</TableHead>
          <TableHead className="text-right">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? <NoRows colSpan={5} /> : null}
        {rows.map((relay, i) => {
          const result = relay.results?.[0];
          return (
            <TableRow
              key={`${relay.eventNumber}-${relay.teamCode}-${relay.relayLetter}-${i}`}
              className={ROW}
            >
              <TableCell>{eventCell(labels, relay.eventNumber)}</TableCell>
              <TableCell>
                {[relay.teamCode, relay.relayLetter]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </TableCell>
              <TableCell className="whitespace-normal">
                {relay.swimmerNames.join(", ") || "—"}
              </TableCell>
              <TableCell className="font-mono tabular-nums">
                {relay.seedTime ?? "NT"}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {result ? (result.isDq ? "DQ" : result.time) : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function EventsTable({ meet, query }: { meet: ParsedMeet; query: string }) {
  const rows = meet.events.filter((e) =>
    matchesFilter(query, eventLabel(e), e.eventNumber, e.eventKey),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">#</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Round</TableHead>
          <TableHead className="font-mono">Key</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? <NoRows colSpan={4} /> : null}
        {rows.map((event, i) => (
          <TableRow
            key={`${event.eventKey}-${event.eventNumber}-${i}`}
            className={ROW}
          >
            <TableCell className="text-right font-mono tabular-nums">
              {event.eventNumber ?? "—"}
            </TableCell>
            <TableCell className="font-medium">{eventLabel(event)}</TableCell>
            <TableCell className="text-muted-foreground">
              {event.roundType ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {event.eventKey}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
