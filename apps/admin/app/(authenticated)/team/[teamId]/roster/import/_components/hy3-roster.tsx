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
import type { Hy3RosterFile } from "@project-aqua/parsers/hy3";
import type { RosterAthlete } from "@project-aqua/parsers/types";
import { useState } from "react";
import { GenderCell } from "./gender-cell";
import { GenderSelect } from "./gender-select";
import { MetricTile } from "./metric-tile";
import { RowCount } from "./row-count";

export function Hy3RosterView({ data }: { data: Hy3RosterFile }) {
  const [nameFilter, setNameFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  const filtered = data.athletes.filter((a) => {
    if (
      nameFilter &&
      !`${a.lastName} ${a.firstName}`
        .toLowerCase()
        .includes(nameFilter.toLowerCase())
    ) {
      return false;
    }
    if (genderFilter !== "all" && a.gender !== genderFilter) {
      return false;
    }
    if (gradeFilter !== "all" && a.gradeYear !== gradeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Team" value={data.team.name} />
        <MetricTile label="Abbreviation" value={data.team.abbreviation} />
        <MetricTile label="Short Name" value={data.team.shortName} />
        <MetricTile label="LSC" value={data.team.lsc} />
        <MetricTile label="Coach" value={data.team.coachName} />
        <MetricTile label="Athletes" value={data.athletes.length} />
      </div>
      {data.team.email && (
        <p className="text-muted-foreground text-xs">
          Email: {data.team.email}
        </p>
      )}
      <Separator />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 w-44 text-sm"
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Filter by name..."
          value={nameFilter}
        />
        <GenderSelect onChange={setGenderFilter} value={genderFilter} />
        <Select onValueChange={setGradeFilter} value={gradeFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            <SelectItem value="FR">Freshman</SelectItem>
            <SelectItem value="SO">Sophomore</SelectItem>
            <SelectItem value="JR">Junior</SelectItem>
            <SelectItem value="SR">Senior</SelectItem>
          </SelectContent>
        </Select>
        <RowCount filtered={filtered.length} total={data.athletes.length} />
      </div>
      <ScrollArea className="h-[420px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Athlete</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a: RosterAthlete) => (
              <TableRow key={a.memberId}>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {a.jerseyNumber || "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {a.lastName}, {a.firstName}
                </TableCell>
                <TableCell>
                  <GenderCell gender={a.gender} />
                </TableCell>
                <TableCell>
                  {a.gradeYear && (
                    <Badge className="text-xs" variant="secondary">
                      {a.gradeYear}
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
