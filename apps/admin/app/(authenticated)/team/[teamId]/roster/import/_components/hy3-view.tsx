"use client";
import { Badge } from "@project-aqua/design-system/components/ui/badge";
import { Input } from "@project-aqua/design-system/components/ui/input";
import { ScrollArea } from "@project-aqua/design-system/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/design-system/components/ui/select";
import { Separator } from "@project-aqua/design-system/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/design-system/components/ui/table";
import {
  flattenHy3Results,
  type Hy3FlatResult,
} from "@project-aqua/parsers/hy3";
import type { Hy3File } from "@project-aqua/parsers/types";
import { ageGroupLabel } from "@project-aqua/parsers/utils";
import { useState } from "react";
import { CourseBadge } from "./course-badge";
import { GenderCell } from "./gender-cell";
import { GenderSelect } from "./gender-select";
import { MetricTile } from "./metric-tile";
import { RowCount } from "./row-count";
import { SplitPills } from "./split-pills";
import { StrokeBadge } from "./stroke-badge";
import { StrokeSelect } from "./stroke-select";
import { TimeCell } from "./time-cell";

export function Hy3View({ data }: { data: Hy3File }) {
  const [nameFilter, setNameFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [strokeFilter, setStrokeFilter] = useState("all");

  const flat = flattenHy3Results(data);
  const teams = [...data.teams.keys()].sort();
  let totalAthletes = 0;
  for (const { athletes } of data.teams.values()) {
    totalAthletes += athletes.length;
  }

  const filtered = flat.filter((r: Hy3FlatResult) => {
    if (
      nameFilter &&
      !`${r.athlete.lastName} ${r.athlete.firstName}`
        .toLowerCase()
        .includes(nameFilter.toLowerCase())
    ) {
      return false;
    }
    if (teamFilter !== "all" && r.teamAbbr !== teamFilter) {
      return false;
    }
    if (genderFilter !== "all" && r.athlete.gender !== genderFilter) {
      return false;
    }
    if (strokeFilter !== "all" && r.entry.stroke !== strokeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <MetricTile label="Meet" value={data.meet.name} />
        <MetricTile label="Facility" value={data.meet.facility} />
        <MetricTile label="Start" value={data.meet.startDate} />
        <MetricTile label="End" value={data.meet.endDate} />
        <MetricTile label="Course" value={data.meet.course} />
        <MetricTile label="Teams" value={data.teams.size} />
        <MetricTile label="Athletes" value={totalAthletes} />
        <MetricTile label="Results" value={flat.length} />
      </div>
      <Separator />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 w-44 text-sm"
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Filter by name..."
          value={nameFilter}
        />
        <Select onValueChange={setTeamFilter} value={teamFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <GenderSelect onChange={setGenderFilter} value={genderFilter} />
        <StrokeSelect onChange={setStrokeFilter} value={strokeFilter} />
        <RowCount filtered={filtered.length} total={flat.length} />
      </div>
      <ScrollArea className="h-105 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Athlete</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>G</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Dist</TableHead>
              <TableHead>Stroke</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Entry Time</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Heat</TableHead>
              <TableHead>Lane</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Splits</TableHead>
              <TableHead>DQ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r: Hy3FlatResult, i: number) => {
              const best =
                r.results.find((x) => x.round === "F") ?? r.results[0];
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    {r.athlete.lastName}, {r.athlete.firstName}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {r.teamAbbr}
                  </TableCell>
                  <TableCell>
                    <GenderCell gender={r.athlete.gender} />
                  </TableCell>
                  <TableCell>{r.athlete.age}</TableCell>
                  <TableCell>{r.entry.distance}</TableCell>
                  <TableCell>
                    <StrokeBadge stroke={r.entry.stroke} />
                  </TableCell>
                  <TableCell>
                    {ageGroupLabel(r.entry.ageGroupMin, r.entry.ageGroupMax)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <TimeCell seconds={r.entry.qualifyingTime} />
                      {r.entry.qualifyingTime && (
                        <CourseBadge course={r.entry.qualifyingCourse} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {best ? (
                      <div className="flex items-center gap-1.5">
                        <TimeCell seconds={best.finishTime} />
                        {best.finishTime && (
                          <CourseBadge course={best.course} />
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">NS</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{best?.heat || "—"}</TableCell>
                  <TableCell className="text-sm">{best?.lane || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {best?.heatPlace || "—"}
                  </TableCell>
                  <TableCell>
                    <SplitPills splits={best?.splits ?? []} />
                  </TableCell>
                  <TableCell>
                    {best?.dqCode && (
                      <Badge className="text-xs" variant="destructive">
                        DQ {best.dqCode}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
