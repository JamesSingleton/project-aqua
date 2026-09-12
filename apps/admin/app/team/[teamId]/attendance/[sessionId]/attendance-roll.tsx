"use client";

import type {
  AttendanceStatus,
  RsvpStatus,
} from "@project-aqua/swim-core/validators";
import { Input } from "@project-aqua/ui/components/input";
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
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setAttendanceAction, setRsvpAction } from "../actions";

const STATUS_ITEMS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
  { value: "late", label: "Late" },
];

const RSVP_ITEMS: { value: RsvpStatus; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "attending", label: "Attending" },
  { value: "absent", label: "Absent" },
  { value: "maybe", label: "Maybe" },
];

export function AttendanceRoll({
  teamId,
  sessionId,
  rows,
}: {
  teamId: string;
  sessionId: string;
  rows: {
    membershipId: string;
    name: string;
    practiceGroup: string | null;
    status: string;
    rsvpStatus: string;
    absenceReason: string | null;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStatus(membershipId: string, status: AttendanceStatus) {
    startTransition(async () => {
      await setAttendanceAction(teamId, sessionId, membershipId, status);
      router.refresh();
    });
  }

  function handleRsvp(
    membershipId: string,
    rsvpStatus: RsvpStatus,
    absenceReason?: string,
  ) {
    startTransition(async () => {
      await setRsvpAction(
        teamId,
        sessionId,
        membershipId,
        rsvpStatus,
        absenceReason,
      );
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Swimmer</TableHead>
          <TableHead>Group</TableHead>
          <TableHead className="w-40">RSVP</TableHead>
          <TableHead>Absence reason</TableHead>
          <TableHead className="w-40">Roll</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.membershipId}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.practiceGroup ?? "—"}</TableCell>
            <TableCell>
              <Select
                items={RSVP_ITEMS}
                value={row.rsvpStatus}
                disabled={pending}
                onValueChange={(v) =>
                  handleRsvp(
                    row.membershipId,
                    v as RsvpStatus,
                    row.absenceReason ?? undefined,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RSVP_ITEMS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                defaultValue={row.absenceReason ?? ""}
                placeholder="Optional"
                disabled={pending || row.rsvpStatus === "attending"}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value === (row.absenceReason ?? "")) return;
                  handleRsvp(
                    row.membershipId,
                    row.rsvpStatus as RsvpStatus,
                    value || undefined,
                  );
                }}
              />
            </TableCell>
            <TableCell>
              <Select
                items={STATUS_ITEMS}
                value={row.status}
                disabled={pending}
                onValueChange={(v) =>
                  handleStatus(row.membershipId, v as AttendanceStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_ITEMS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
