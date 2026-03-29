"use client";
import { Input } from "@project-aqua/design-system/components/ui/input";
import { ScrollArea } from "@project-aqua/design-system/components/ui/scroll-area";
import { Separator } from "@project-aqua/design-system/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/design-system/components/ui/table";
import { groupSd3ByAthlete } from "@project-aqua/parsers/sd3";
import type { Sd3File } from "@project-aqua/parsers/types";
import { ageGroupLabel } from "@project-aqua/parsers/utils";
import { useState } from "react";
import { CourseBadge } from "./course-badge";
import { GenderCell } from "./gender-cell";
import { GenderSelect } from "./gender-select";
import { MetricTile } from "./metric-tile";
import { RowCount } from "./row-count";
import { StrokeBadge } from "./stroke-badge";
import { StrokeSelect } from "./stroke-select";
import { TimeCell } from "./time-cell";

export function Sd3View({ data }: { data: Sd3File }) {
  const [nameFilter, setNameFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [strokeFilter, setStrokeFilter] = useState("all");
  const athletes = groupSd3ByAthlete(data);

  const filtered = data.entries.filter((e) => {
    if (
      nameFilter &&
      !`${e.lastName} ${e.firstName}`
        .toLowerCase()
        .includes(nameFilter.toLowerCase())
    ) {
      return false;
    }
    if (genderFilter !== "all" && e.gender !== genderFilter) {
      return false;
    }
    if (strokeFilter !== "all" && e.stroke !== strokeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Meet" value={data.meet.name} />
        <MetricTile
          label="Team"
          value={`${data.team.name} (${data.team.abbreviation})`}
        />
        <MetricTile
          label="Location"
          value={`${data.team.city}, ${data.team.state}`}
        />
        <MetricTile label="Athletes" value={athletes.size} />
        <MetricTile label="Entries" value={data.entries.length} />
        <MetricTile label="Course" value={data.meet.courseCode || "SCY"} />
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
        <RowCount filtered={filtered.length} total={data.entries.length} />
      </div>
      <ScrollArea className="h-105 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Athlete</TableHead>
              <TableHead>G</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Dist</TableHead>
              <TableHead>Stroke</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Seed Time</TableHead>
              <TableHead>Member ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  {e.lastName}, {e.firstName}
                </TableCell>
                <TableCell>
                  <GenderCell gender={e.gender} />
                </TableCell>
                <TableCell>{e.age}</TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {e.dob}
                </TableCell>
                <TableCell>{e.distance}</TableCell>
                <TableCell>
                  <StrokeBadge stroke={e.stroke} />
                </TableCell>
                <TableCell>
                  {ageGroupLabel(e.ageGroupMin, e.ageGroupMax)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <TimeCell seconds={e.seedTime} />
                    {e.seedTime && <CourseBadge course={e.seedCourse} />}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {e.memberId}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
