"use client";
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
import type { HyvFile } from "@project-aqua/parsers/types";
import { ageGroupLabel } from "@project-aqua/parsers/utils";
import { useState } from "react";
import { GenderCell } from "./gender-cell";
import { GenderSelect } from "./gender-select";
import { MetricTile } from "./metric-tile";
import { RoundBadge } from "./round-badge";
import { RowCount } from "./row-count";
import { StrokeBadge } from "./stroke-badge";
import { StrokeSelect } from "./stroke-select";
import { TimeCell } from "./time-cell";

export function HyvView({ data }: { data: HyvFile }) {
  const [genderFilter, setGenderFilter] = useState("all");
  const [strokeFilter, setStrokeFilter] = useState("all");

  const filtered = data.events.filter((e) => {
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
        <MetricTile label="Facility" value={data.meet.facility} />
        <MetricTile label="Start" value={data.meet.startDate} />
        <MetricTile label="End" value={data.meet.endDate} />
        <MetricTile label="Course" value={data.meet.course} />
        <MetricTile label="Events" value={data.events.length} />
      </div>
      <Separator />
      <div className="flex flex-wrap items-center gap-2">
        <GenderSelect onChange={setGenderFilter} value={genderFilter} />
        <StrokeSelect onChange={setStrokeFilter} value={strokeFilter} />
        <RowCount filtered={filtered.length} total={data.events.length} />
      </div>
      <ScrollArea className="h-105 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Dist</TableHead>
              <TableHead>Stroke</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Round</TableHead>
              <TableHead>A-Cut</TableHead>
              <TableHead>B-Cut</TableHead>
              <TableHead>Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium font-mono">
                  {e.eventCode}
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
                  <RoundBadge round={e.roundType} />
                </TableCell>
                <TableCell>
                  <TimeCell seconds={e.aCut} />
                </TableCell>
                <TableCell>
                  <TimeCell seconds={e.bCut} />
                </TableCell>
                <TableCell className="text-sm">
                  {e.entryFee > 0 ? `$${e.entryFee.toFixed(2)}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
