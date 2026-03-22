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
  type Cl2EntriesFile,
  type Cl2ResultsFile,
  groupCl2ByAthlete,
} from "@project-aqua/parsers/cl2";
import { ageGroupLabel } from "@project-aqua/parsers/utils";
import { useState } from "react";
import { GenderCell } from "./gender-cell";
import { GenderSelect } from "./gender-select";
import { MetricTile } from "./metric-tile";
import { RoundBadge } from "./round-badge";
import { RowCount } from "./row-count";
import { SplitPills } from "./split-pills";
import { StrokeBadge } from "./stroke-badge";
import { StrokeSelect } from "./stroke-select";
import { TimeCell } from "./time-cell";

export function Cl2ResultsView({
  data,
}: {
  data: Cl2ResultsFile | Cl2EntriesFile;
}) {
  const [nameFilter, setNameFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [strokeFilter, setStrokeFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const byAthlete = groupCl2ByAthlete(data);

  const filtered = data.results.filter((r) => {
    if (
      nameFilter &&
      !`${r.lastName} ${r.firstName}`
        .toLowerCase()
        .includes(nameFilter.toLowerCase())
    ) {
      return false;
    }
    if (genderFilter !== "all" && r.gender !== genderFilter) {
      return false;
    }
    if (strokeFilter !== "all" && r.stroke !== strokeFilter) {
      return false;
    }
    if (roundFilter !== "all" && r.round !== roundFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <MetricTile label="Meet" value={data.meet.name} />
        <MetricTile
          label="City"
          value={`${data.meet.city}, ${data.meet.state}`}
        />
        <MetricTile label="Start" value={data.meet.startDate} />
        <MetricTile label="End" value={data.meet.endDate} />
        <MetricTile label="Course" value={data.meet.course} />
        <MetricTile label="Teams" value={data.teams.length} />
        <MetricTile label="Athletes" value={byAthlete.size} />
        <MetricTile label="Results" value={data.results.length} />
      </div>
      <Separator />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 w-44 text-sm"
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Filter by name..."
          value={nameFilter}
        />
        <GenderSelect onChange={setGenderFilter} value={genderFilter} />
        <StrokeSelect onChange={setStrokeFilter} value={strokeFilter} />
        <Select onValueChange={setRoundFilter} value={roundFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Round" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rounds</SelectItem>
            <SelectItem value="F">Finals</SelectItem>
            <SelectItem value="P">Prelims</SelectItem>
          </SelectContent>
        </Select>
        <RowCount filtered={filtered.length} total={data.results.length} />
      </div>
      <ScrollArea className="h-[420px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Athlete</TableHead>
              <TableHead>G</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Dist</TableHead>
              <TableHead>Stroke</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Rnd</TableHead>
              <TableHead>Heat</TableHead>
              <TableHead>Lane</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Splits</TableHead>
              <TableHead>DQ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  {r.lastName}, {r.firstName}
                </TableCell>
                <TableCell>
                  <GenderCell gender={r.gender} />
                </TableCell>
                <TableCell>{r.age}</TableCell>
                <TableCell>{r.distance}</TableCell>
                <TableCell>
                  <StrokeBadge stroke={r.stroke} />
                </TableCell>
                <TableCell>
                  {ageGroupLabel(r.ageGroupMin, r.ageGroupMax)}
                </TableCell>
                <TableCell>
                  <RoundBadge round={r.round} />
                </TableCell>
                <TableCell className="text-sm">{r.heat || "—"}</TableCell>
                <TableCell className="text-sm">{r.lane || "—"}</TableCell>
                <TableCell className="text-sm">{r.heatPlace || "—"}</TableCell>
                <TableCell>
                  <TimeCell seconds={r.finishTime} />
                </TableCell>
                <TableCell>
                  <SplitPills splits={r.splits} />
                </TableCell>
                <TableCell>
                  {r.dqCode && (
                    <Badge className="text-xs" variant="destructive">
                      DQ {r.dqCode}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
