"use client";

import { formatTime } from "@project-aqua/swim-core/times";
import { Button } from "@project-aqua/ui/components/button";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

export type TopTimeRow = {
  swimmerName: string;
  swimmerId: string;
  eventKey: string;
  eventLabel: string;
  course: "SCY" | "SCM" | "LCM";
  timeMs: number;
  achievedAt: string;
};

type GroupBy = "none" | "event" | "swimmer" | "course";
type CourseFilter = "all" | "SCY" | "SCM" | "LCM";

const DEFAULT_GROUP_BY: GroupBy = "event";
const DEFAULT_COURSE_FILTER: CourseFilter = "all";
const DEFAULT_EVENT_FILTER = "all";

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "event", label: "Event" },
  { value: "swimmer", label: "Swimmer" },
  { value: "course", label: "Course" },
];

const COURSE_OPTIONS: { value: CourseFilter; label: string }[] = [
  { value: "all", label: "All courses" },
  { value: "SCY", label: "SCY" },
  { value: "SCM", label: "SCM" },
  { value: "LCM", label: "LCM" },
];

function isGroupBy(value: string): value is GroupBy {
  return (
    value === "none" ||
    value === "event" ||
    value === "swimmer" ||
    value === "course"
  );
}

function isCourseFilter(value: string): value is CourseFilter {
  return (
    value === "all" || value === "SCY" || value === "SCM" || value === "LCM"
  );
}

function groupKeyFor(row: TopTimeRow, groupBy: GroupBy): string {
  if (groupBy === "event") return row.eventKey;
  if (groupBy === "swimmer") return row.swimmerId;
  if (groupBy === "course") return row.course;
  return "all";
}

function groupLabelFor(row: TopTimeRow, groupBy: GroupBy): string {
  if (groupBy === "event") return row.eventLabel;
  if (groupBy === "swimmer") return row.swimmerName;
  if (groupBy === "course") return row.course;
  return "";
}

export function TeamTopTimes({
  times,
  teamId,
}: {
  times: TopTimeRow[];
  teamId: string;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>(DEFAULT_GROUP_BY);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>(
    DEFAULT_COURSE_FILTER,
  );
  const [eventFilter, setEventFilter] = useState(DEFAULT_EVENT_FILTER);
  const [swimmerQuery, setSwimmerQuery] = useState("");

  const filtersActive =
    courseFilter !== DEFAULT_COURSE_FILTER ||
    eventFilter !== DEFAULT_EVENT_FILTER ||
    swimmerQuery.trim() !== "";

  function clearFilters() {
    setCourseFilter(DEFAULT_COURSE_FILTER);
    setEventFilter(DEFAULT_EVENT_FILTER);
    setSwimmerQuery("");
  }

  const eventOptions = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const row of times) {
      if (!byKey.has(row.eventKey)) {
        byKey.set(row.eventKey, row.eventLabel);
      }
    }
    return [...byKey.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [times]);

  const filtered = useMemo(() => {
    const query = swimmerQuery.trim().toLowerCase();
    return times.filter((row) => {
      if (courseFilter !== "all" && row.course !== courseFilter) return false;
      if (eventFilter !== "all" && row.eventKey !== eventFilter) return false;
      if (query && !row.swimmerName.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [times, courseFilter, eventFilter, swimmerQuery]);

  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "", rows: filtered }];
    }

    const map = new Map<string, { label: string; rows: TopTimeRow[] }>();
    for (const row of filtered) {
      const key = groupKeyFor(row, groupBy);
      const existing = map.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        map.set(key, { label: groupLabelFor(row, groupBy), rows: [row] });
      }
    }

    return [...map.entries()]
      .map(([key, value]) => ({ key, label: value.label, rows: value.rows }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, groupBy]);

  const showSwimmer = groupBy !== "swimmer";
  const showEvent = groupBy !== "event";
  const showCourse = groupBy !== "course";

  if (times.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No times yet. Import meet results to track progression.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="top-times-group">Group by</Label>
          <Select
            items={GROUP_BY_OPTIONS}
            value={groupBy}
            onValueChange={(value) => {
              if (value != null && isGroupBy(value)) setGroupBy(value);
            }}
          >
            <SelectTrigger id="top-times-group" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {GROUP_BY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="top-times-course">Course</Label>
          <Select
            items={COURSE_OPTIONS}
            value={courseFilter}
            onValueChange={(value) => {
              if (value != null && isCourseFilter(value)) {
                setCourseFilter(value);
              }
            }}
          >
            <SelectTrigger id="top-times-course" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {COURSE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="top-times-event">Event</Label>
          <Select
            items={[{ value: "all", label: "All events" }, ...eventOptions]}
            value={eventFilter}
            onValueChange={(value) => {
              if (value != null) setEventFilter(value);
            }}
          >
            <SelectTrigger id="top-times-event" className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All events</SelectItem>
                {eventOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[160px] flex-col gap-1.5">
          <Label htmlFor="top-times-swimmer">Swimmer</Label>
          <Input
            id="top-times-swimmer"
            placeholder="Name…"
            value={swimmerQuery}
            onChange={(event) => setSwimmerQuery(event.target.value)}
          />
        </div>

        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mb-0.5"
          >
            <XIcon data-icon="inline-start" />
            Clear filters
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No times match the current filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {showSwimmer ? <TableHead>Swimmer</TableHead> : null}
              {showEvent ? <TableHead>Event</TableHead> : null}
              {showCourse ? <TableHead>Course</TableHead> : null}
              <TableHead>Time</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                {groupBy !== "none" ? (
                  <TableRow className="bg-muted/40">
                    <TableCell
                      colSpan={
                        2 +
                        (showSwimmer ? 1 : 0) +
                        (showEvent ? 1 : 0) +
                        (showCourse ? 1 : 0)
                      }
                      className="font-medium"
                    >
                      {group.label}
                      <span className="ml-2 text-muted-foreground font-normal">
                        {group.rows.length}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : null}
                {group.rows.map((row, i) => (
                  <TableRow
                    key={`${group.key}-${row.swimmerId}-${row.eventKey}-${i}`}
                  >
                    {showSwimmer ? (
                      <TableCell>
                        <Link
                          href={`/team/${teamId}/swimmers/${row.swimmerId}/progression`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {row.swimmerName}
                        </Link>
                      </TableCell>
                    ) : null}
                    {showEvent ? <TableCell>{row.eventLabel}</TableCell> : null}
                    {showCourse ? <TableCell>{row.course}</TableCell> : null}
                    <TableCell className="font-timing">
                      {formatTime(row.timeMs)}
                    </TableCell>
                    <TableCell>
                      {new Date(row.achievedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
