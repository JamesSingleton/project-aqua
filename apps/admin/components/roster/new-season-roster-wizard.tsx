"use client";

import {
  formatLocalDateOnly,
  formatLocalDateOnlyLabel,
  parseLocalDateOnly,
} from "@project-aqua/swim-core/calendar-date";
import {
  ACADEMIC_STANDING_LABELS,
  type AcademicStanding,
  CLASS_YEAR_LABELS,
  type ClassYear,
  ELIGIBILITY_STATUS_LABELS,
  type EligibilityStatus,
} from "@project-aqua/swim-core/team-types";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button } from "@project-aqua/ui/components/button";
import { Calendar } from "@project-aqua/ui/components/calendar";
import { Checkbox } from "@project-aqua/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@project-aqua/ui/components/dialog";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { cn } from "@project-aqua/ui/lib/utils";
import { CalendarIcon, CalendarPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import {
  commitNewSeasonAction,
  previewNewSeasonAction,
} from "@/app/team/[teamId]/roster/season-actions";

type PreviewResult = Awaited<ReturnType<typeof previewNewSeasonAction>>;
type PreviewRow = PreviewResult["rows"][number];

type EnrollmentDraft = {
  membershipId: string;
  groupId: string | null;
  classYear: string | null;
  academicStanding: string | null;
  eligibilityStatus: string | null;
  seasonsOfCompetitionUsed: number | null;
};

function SeasonDatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseLocalDateOnly(value);
  const label = formatLocalDateOnlyLabel(value, "long");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {label ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            onChange(date ? formatLocalDateOnly(date) : "");
            setOpen(false);
          }}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

function displayName(row: PreviewRow) {
  const first = row.preferredName || row.firstName;
  return `${first} ${row.lastName}`.trim();
}

function classLabel(value: string | null) {
  if (!value) return "—";
  return CLASS_YEAR_LABELS[value as ClassYear] ?? value;
}

function standingLabel(value: string | null) {
  if (!value) return "—";
  return ACADEMIC_STANDING_LABELS[value as AcademicStanding] ?? value;
}

function eligibilityLabel(value: string | null) {
  if (!value) return "—";
  return ELIGIBILITY_STATUS_LABELS[value as EligibilityStatus] ?? value;
}

export function NewSeasonRosterWizard({
  teamId,
  sourceSeasonId,
  showClassYear = false,
  showCollegeEligibility = false,
}: {
  teamId: string;
  sourceSeasonId: string;
  showClassYear?: boolean;
  showCollegeEligibility?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState("");

  const [label, setLabel] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const loadPreview = useEffectEvent(async () => {
    setLoadingPreview(true);
    setError("");
    try {
      const preview = await previewNewSeasonAction(teamId, sourceSeasonId);
      setLabel(preview.proposedSeason.label);
      setStartsOn(preview.proposedSeason.startsOn);
      setEndsOn(preview.proposedSeason.endsOn);
      setMakeCurrent(true);
      setRows(preview.rows);
      setSelected(
        new Set(
          preview.rows
            .filter((row) => row.defaultSelected)
            .map((row) => row.membershipId),
        ),
      );
      setStep(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load season preview",
      );
    } finally {
      setLoadingPreview(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    void loadPreview();
  }, [open, teamId, sourceSeasonId]);

  function toggleMembership(membershipId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(membershipId);
      else next.delete(membershipId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected(new Set(rows.map((row) => row.membershipId)));
    } else {
      setSelected(new Set());
    }
  }

  function buildEnrollments(): EnrollmentDraft[] {
    return rows
      .filter((row) => selected.has(row.membershipId))
      .map((row) => ({
        membershipId: row.membershipId,
        groupId: row.groupId,
        classYear: row.proposedClassYear,
        academicStanding: row.proposedAcademicStanding,
        eligibilityStatus: row.proposedEligibilityStatus,
        seasonsOfCompetitionUsed: row.proposedSeasonsUsed,
      }));
  }

  function onCommit() {
    setError("");
    startTransition(async () => {
      try {
        const season = await commitNewSeasonAction(teamId, {
          sourceSeasonId,
          label: label.trim(),
          startsOn,
          endsOn,
          makeCurrent,
          enrollments: buildEnrollments(),
        });
        setOpen(false);
        router.push(`/team/${teamId}/roster?season=${season.id}`);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create season roster",
        );
      }
    });
  }

  const selectedCount = selected.size;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && selectedCount < rows.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError("");
          setStep(1);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <CalendarPlusIcon data-icon="inline-start" />
        New season roster
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New season roster</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Set the season dates and whether it becomes current."
              : step === 2
                ? "Choose who rolls forward into the new season."
                : "Confirm and create the new season roster."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-4">
          {loadingPreview ? (
            <p className="text-muted-foreground text-sm">Loading preview…</p>
          ) : null}

          {!loadingPreview && step === 1 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="season-label">Season label</Label>
                <Input
                  id="season-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="2026-2027"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="season-starts">Starts on</Label>
                  <SeasonDatePicker
                    id="season-starts"
                    value={startsOn}
                    onChange={setStartsOn}
                    placeholder="Start date"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="season-ends">Ends on</Label>
                  <SeasonDatePicker
                    id="season-ends"
                    value={endsOn}
                    onChange={setEndsOn}
                    placeholder="End date"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="make-current-season"
                  checked={makeCurrent}
                  onCheckedChange={(checked) =>
                    setMakeCurrent(checked === true)
                  }
                />
                <Label htmlFor="make-current-season">
                  Make this the current season
                </Label>
              </div>
            </div>
          ) : null}

          {!loadingPreview && step === 2 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                  {selectedCount} of {rows.length} selected
                </p>
                <Badge variant="outline">Step 2 of 3</Badge>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onCheckedChange={(checked) =>
                            toggleAll(checked === true)
                          }
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      {showClassYear ? <TableHead>Class year</TableHead> : null}
                      {showCollegeEligibility ? (
                        <>
                          <TableHead>Standing</TableHead>
                          <TableHead>Eligibility</TableHead>
                          <TableHead>Seasons used</TableHead>
                        </>
                      ) : null}
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const isSelected = selected.has(row.membershipId);
                      return (
                        <TableRow key={row.membershipId}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                toggleMembership(
                                  row.membershipId,
                                  checked === true,
                                )
                              }
                              aria-label={`Select ${displayName(row)}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {displayName(row)}
                          </TableCell>
                          {showClassYear ? (
                            <TableCell>
                              <span className="text-muted-foreground">
                                {classLabel(row.priorClassYear)}
                              </span>
                              {" → "}
                              {classLabel(row.proposedClassYear)}
                            </TableCell>
                          ) : null}
                          {showCollegeEligibility ? (
                            <>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {standingLabel(row.priorAcademicStanding)}
                                </span>
                                {" → "}
                                {standingLabel(row.proposedAcademicStanding)}
                              </TableCell>
                              <TableCell>
                                {eligibilityLabel(
                                  row.proposedEligibilityStatus,
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {row.priorSeasonsUsed ?? "—"}
                                </span>
                                {" → "}
                                {row.proposedSeasonsUsed ?? "—"}
                              </TableCell>
                            </>
                          ) : null}
                          <TableCell>
                            {row.reasonExcluded === "graduated" ? (
                              <Badge variant="secondary">Graduated</Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={
                            3 +
                            (showClassYear ? 1 : 0) +
                            (showCollegeEligibility ? 3 : 0)
                          }
                          className="text-muted-foreground text-center"
                        >
                          No active enrollments in the source season.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {!loadingPreview && step === 3 ? (
            <div className="flex flex-col gap-3 text-sm">
              <p>
                Creating <strong>{label.trim() || "new season"}</strong> with{" "}
                <strong>{selectedCount}</strong>{" "}
                {selectedCount === 1 ? "athlete" : "athletes"}
                {makeCurrent ? " and setting it as current" : ""}.
              </p>
              <p className="text-muted-foreground">
                You can add newcomers after creating the season from the roster
                page.
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <div className="flex gap-2">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending || loadingPreview}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                disabled={
                  pending ||
                  loadingPreview ||
                  (step === 1 && (!label.trim() || !startsOn || !endsOn))
                }
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                disabled={pending || loadingPreview || !label.trim()}
                onClick={onCommit}
              >
                {pending ? "Creating…" : "Create season roster"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
