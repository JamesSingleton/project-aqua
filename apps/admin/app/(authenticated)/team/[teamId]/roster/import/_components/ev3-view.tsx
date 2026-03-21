"use client";
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
import type { Ev3File } from "@project-aqua/parsers/types";
import { ageGroupLabel } from "@project-aqua/parsers/utils";
import { useState } from "react";
import { GenderCell } from "./gender-cell";
import { GenderSelect } from "./gender-select";
import { MetricTile } from "./metric-tile";
import { RoundBadge } from "./round-badge";
import { RowCount } from "./row-count";
import { StrokeBadge } from "./stroke-badge";
import { StrokeSelect } from "./stroke-select";

export function Ev3View({ data }: { data: Ev3File }) {
  const [genderFilter, setGenderFilter] = useState("all");
  const [strokeFilter, setStrokeFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");

  const sessions = [...new Set(data.events.map((e) => e.session))].sort(
    (a, b) => a - b
  );

  const filtered = data.events.filter((e) => {
    if (genderFilter !== "all" && e.gender !== genderFilter) {
      return false;
    }
    if (strokeFilter !== "all" && e.stroke !== strokeFilter) {
      return false;
    }
    if (sessionFilter !== "all" && String(e.session) !== sessionFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Meet" value={data.header.name} />
        <MetricTile label="Facility" value={data.header.facility} />
        <MetricTile label="Sanction" value={data.header.meetSanction} />
        <MetricTile label="Sessions" value={data.header.sessionCount} />
        <MetricTile label="Course" value={data.header.course} />
        <MetricTile label="Events" value={data.events.length} />
      </div>
      <Separator />
      <div className="flex flex-wrap items-center gap-2">
        <GenderSelect onChange={setGenderFilter} value={genderFilter} />
        <StrokeSelect onChange={setStrokeFilter} value={strokeFilter} />
        <Select onValueChange={setSessionFilter} value={sessionFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={String(s)}>
                Session {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RowCount filtered={filtered.length} total={data.events.length} />
      </div>
      <ScrollArea className="h-105 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>#</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Dist</TableHead>
              <TableHead>Stroke</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Round</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Lanes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium font-mono">
                  {e.eventCode}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {e.eventNumber}
                </TableCell>
                <TableCell>
                  <GenderCell gender={e.gender} />
                </TableCell>
                <TableCell>{e.distance}</TableCell>
                <TableCell>
                  <StrokeBadge stroke={e.stroke} />
                </TableCell>
                <TableCell>{ageGroupLabel(e.ageMin, e.ageMax)}</TableCell>
                <TableCell>
                  <RoundBadge round={e.round} />
                </TableCell>
                <TableCell className="text-sm">{e.session}</TableCell>
                <TableCell className="text-sm">{e.startTime || "—"}</TableCell>
                <TableCell className="text-sm">{e.laneCount || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
