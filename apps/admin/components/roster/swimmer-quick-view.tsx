"use client";

import {
  formatBestTimeAchievedLabel,
  formatDateOnlyLabel,
} from "@project-aqua/swim-core/calendar-date";
import {
  ACADEMIC_STANDING_LABELS,
  type AcademicStanding,
  ELIGIBILITY_STATUS_LABELS,
  type EligibilityStatus,
} from "@project-aqua/swim-core/team-types";
import { formatTime } from "@project-aqua/swim-core/times";
import { Avatar, AvatarFallback } from "@project-aqua/ui/components/avatar";
import { Badge } from "@project-aqua/ui/components/badge";
import { Button, buttonVariants } from "@project-aqua/ui/components/button";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@project-aqua/ui/components/sheet";
import { cn } from "@project-aqua/ui/lib/utils";
import { CheckIcon, CopyIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";
import { fetchSwimmerQuickViewAction } from "@/app/team/[teamId]/roster/actions";
import type { Athlete } from "@/types";
import { ClassYearDisplay } from "./class-year-display";

type QuickViewDetails = Awaited<ReturnType<typeof fetchSwimmerQuickViewAction>>;

function standingLabel(value: string | null | undefined) {
  if (!value) return null;
  return ACADEMIC_STANDING_LABELS[value as AcademicStanding] ?? value;
}

function eligibilityLabel(value: string | null | undefined) {
  if (!value) return null;
  return ELIGIBILITY_STATUS_LABELS[value as EligibilityStatus] ?? value;
}

function initials(athlete: Athlete) {
  const first = (athlete.preferredName || athlete.firstName || "?").charAt(0);
  const last = (athlete.lastName || "?").charAt(0);
  return `${first}${last}`.toUpperCase();
}

function formatBirthday(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function statusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "default" as const;
  if (normalized === "inactive") return "outline" as const;
  return "secondary" as const;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right font-medium text-pretty">{value}</dd>
    </div>
  );
}

function hasContactValue(
  contacts: QuickViewDetails["contacts"],
): contacts is NonNullable<QuickViewDetails["contacts"]> {
  if (!contacts) return false;
  return Boolean(
    contacts.parentName ||
      contacts.parentEmail ||
      contacts.parentPhone ||
      contacts.emergencyName ||
      contacts.emergencyPhone,
  );
}

function hasMedicalValue(
  medical: QuickViewDetails["medical"],
): medical is NonNullable<QuickViewDetails["medical"]> {
  if (!medical) return false;
  return Boolean(
    medical.allergies ||
      medical.medications ||
      medical.conditions ||
      medical.notes,
  );
}

function SwimmerIdCopy({ swimmerId }: { swimmerId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(swimmerId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bg-muted/40 flex flex-col gap-1.5 rounded-lg border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Swimmer ID
        </p>
        <Button
          type="button"
          size="xs"
          variant={copied ? "secondary" : "ghost"}
          onClick={handleCopy}
          aria-label={copied ? "Swimmer ID copied" : "Copy swimmer ID"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="font-mono text-xs break-all" title={swimmerId}>
        {swimmerId}
      </p>
      <p className="text-muted-foreground text-xs">
        Internal ID used for imports, support, and linking records.
      </p>
    </div>
  );
}

export function SwimmerQuickView({
  teamId,
  athlete,
  open,
  onOpenChange,
  showUsaSwimmingId = true,
}: {
  teamId: string;
  athlete: Athlete;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showUsaSwimmingId?: boolean;
}) {
  const profileHref = `/team/${teamId}/swimmers/${athlete.id}`;
  const editHref = `${profileHref}/edit`;
  const legalName = `${athlete.firstName} ${athlete.lastName}`.trim();
  const usesPreferred =
    Boolean(athlete.preferredName) &&
    athlete.preferredName !== athlete.firstName;
  const groups =
    athlete.trainingGroups.length > 0
      ? athlete.trainingGroups.join(", ")
      : athlete.trainingGroup || athlete.practiceGroup || "—";
  const classDisplay = athlete.classYear ? (
    <ClassYearDisplay value={athlete.classYear} />
  ) : null;
  const academicLabel = standingLabel(athlete.academicStanding);
  const eligibilityDisplay = eligibilityLabel(athlete.eligibilityStatus);
  const hasCollegeEligibility =
    Boolean(academicLabel) ||
    Boolean(eligibilityDisplay) ||
    athlete.seasonsOfCompetitionUsed != null ||
    Boolean(athlete.eligibilityNotes);

  const [details, setDetails] = useState<QuickViewDetails | null>(null);
  const [loadError, setLoadError] = useState("");
  const [pending, startTransition] = useTransition();

  const loadDetails = useEffectEvent(() => {
    setLoadError("");
    startTransition(async () => {
      try {
        const data = await fetchSwimmerQuickViewAction(
          teamId,
          athlete.id,
          athlete.membershipId,
        );
        setDetails(data);
      } catch (err) {
        setDetails(null);
        setLoadError(
          err instanceof Error ? err.message : "Could not load details",
        );
      }
    });
  });

  useEffect(() => {
    if (!open) {
      setDetails(null);
      setLoadError("");
      return;
    }
    loadDetails();
  }, [open, athlete.id, athlete.membershipId, teamId]);

  const contacts = details?.contacts ?? null;
  const medical = details?.medical ?? null;
  const bestTimes = details?.bestTimes ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-start gap-3 pr-8">
            <Avatar size="lg">
              <AvatarFallback>{initials(athlete)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="truncate text-lg">
                  {athlete.name}
                </SheetTitle>
                <Badge
                  variant={statusVariant(athlete.status)}
                  className="capitalize"
                >
                  {athlete.status}
                </Badge>
              </div>
              <SheetDescription>
                <span className="inline-flex flex-wrap items-center gap-x-1.5">
                  <span>{athlete.gender}</span>
                  {athlete.age ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Age {athlete.age}</span>
                    </>
                  ) : null}
                  {classDisplay ? (
                    <>
                      <span aria-hidden="true">·</span>
                      {classDisplay}
                    </>
                  ) : null}
                </span>
              </SheetDescription>
              {usesPreferred ? (
                <p className="text-muted-foreground text-xs">
                  Legal name {legalName}
                </p>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <SwimmerIdCopy swimmerId={athlete.id} />

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Roster</h3>
            <dl className="flex flex-col gap-3 text-sm">
              <DetailRow
                label="Birthday"
                value={formatBirthday(athlete.dateOfBirth)}
              />
              <DetailRow label="Gender" value={athlete.gender} />
              <DetailRow label="Age" value={athlete.age || "—"} />
              <DetailRow label="Training group" value={groups} />
              {classDisplay ? (
                <DetailRow label="Class" value={classDisplay} />
              ) : null}
              {hasCollegeEligibility ? (
                <>
                  {academicLabel ? (
                    <DetailRow
                      label="Academic standing"
                      value={academicLabel}
                    />
                  ) : null}
                  {eligibilityDisplay ? (
                    <DetailRow label="Eligibility" value={eligibilityDisplay} />
                  ) : null}
                  {athlete.seasonsOfCompetitionUsed != null ? (
                    <DetailRow
                      label="Seasons used"
                      value={athlete.seasonsOfCompetitionUsed}
                    />
                  ) : null}
                  {athlete.eligibilityNotes ? (
                    <DetailRow
                      label="Eligibility notes"
                      value={athlete.eligibilityNotes}
                    />
                  ) : null}
                </>
              ) : null}
              <DetailRow
                label="Status"
                value={<span className="capitalize">{athlete.status}</span>}
              />
              {showUsaSwimmingId ? (
                <DetailRow
                  label="USA Swimming ID"
                  value={
                    athlete.usaId ? (
                      <span className="font-mono text-xs">{athlete.usaId}</span>
                    ) : (
                      "—"
                    )
                  }
                />
              ) : null}
            </dl>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Contacts</h3>
            {pending && !details ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : details?.piiDenied ? (
              <p className="text-muted-foreground text-sm">
                Contact details require additional access for minors.
              </p>
            ) : hasContactValue(contacts) ? (
              <div className="flex flex-col gap-4 text-sm">
                {contacts.parentName ||
                contacts.parentEmail ||
                contacts.parentPhone ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Parent / guardian
                    </p>
                    {contacts.parentName ? (
                      <p className="font-medium">{contacts.parentName}</p>
                    ) : null}
                    {contacts.parentEmail ? (
                      <a
                        href={`mailto:${contacts.parentEmail}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {contacts.parentEmail}
                      </a>
                    ) : null}
                    {contacts.parentPhone ? (
                      <a
                        href={`tel:${contacts.parentPhone}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {contacts.parentPhone}
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {contacts.emergencyName || contacts.emergencyPhone ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      Emergency
                    </p>
                    {contacts.emergencyName ? (
                      <p className="font-medium">{contacts.emergencyName}</p>
                    ) : null}
                    {contacts.emergencyPhone ? (
                      <a
                        href={`tel:${contacts.emergencyPhone}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {contacts.emergencyPhone}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No contacts on file.
              </p>
            )}
          </section>

          {hasMedicalValue(medical) ? (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Medical notes</h3>
                <dl className="flex flex-col gap-3 text-sm">
                  {medical.allergies ? (
                    <DetailRow label="Allergies" value={medical.allergies} />
                  ) : null}
                  {medical.medications ? (
                    <DetailRow
                      label="Medications"
                      value={medical.medications}
                    />
                  ) : null}
                  {medical.conditions ? (
                    <DetailRow label="Conditions" value={medical.conditions} />
                  ) : null}
                  {medical.notes ? (
                    <DetailRow label="Notes" value={medical.notes} />
                  ) : null}
                </dl>
              </section>
            </>
          ) : null}

          <Separator />

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Best times</h3>
              {bestTimes.length > 0 ? (
                <Link
                  href={`${profileHref}/progression`}
                  className="text-muted-foreground text-xs hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  View all
                </Link>
              ) : null}
            </div>
            {pending && !details ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : bestTimes.length > 0 ? (
              <dl className="flex flex-col gap-3 text-sm">
                {bestTimes.slice(0, 8).map((record) => (
                  <DetailRow
                    key={`${record.eventKey}-${record.course}`}
                    label={`${record.eventLabel} · ${record.course}`}
                    value={
                      <span className="flex flex-col items-end gap-0.5">
                        <span className="font-timing">
                          {formatTime(record.timeMs)}
                        </span>
                        <span className="text-muted-foreground font-normal text-xs">
                          {formatBestTimeAchievedLabel(
                            new Date(record.achievedAt),
                            record.meetName,
                            (date) =>
                              formatDateOnlyLabel(date, undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }),
                          )}
                        </span>
                      </span>
                    }
                  />
                ))}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                No best times recorded yet.
              </p>
            )}
          </section>

          {loadError ? (
            <p className="text-destructive text-sm" role="alert">
              {loadError}
            </p>
          ) : null}
        </div>

        <SheetFooter className="border-t sm:flex-row">
          <Link
            href={editHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto",
            )}
          >
            <PencilIcon data-icon="inline-start" />
            Edit
          </Link>
          <Link
            href={profileHref}
            className={cn(buttonVariants(), "w-full sm:flex-1")}
            onClick={() => onOpenChange(false)}
          >
            View full profile
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
