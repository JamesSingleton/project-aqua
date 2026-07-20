"use client";

import {
  CLASS_YEAR_LABELS,
  type ClassYear,
} from "@project-aqua/swim-core/team-types";
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
import { CopyIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Athlete } from "@/types";

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

function classYearLabel(value: string | null | undefined) {
  if (!value) return null;
  const label = CLASS_YEAR_LABELS[value as ClassYear];
  return label ? `${value} · ${label}` : value;
}

function statusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "default" as const;
  if (normalized === "inactive") return "outline" as const;
  return "secondary" as const;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right font-medium text-pretty">{value}</dd>
    </div>
  );
}

export function SwimmerQuickView({
  teamId,
  athlete,
  open,
  onOpenChange,
}: {
  teamId: string;
  athlete: Athlete;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profileHref = `/team/${teamId}/swimmers/${athlete.id}`;
  const editHref = `${profileHref}/edit`;
  const classLabel = classYearLabel(athlete.classYear);
  const groups =
    athlete.trainingGroups.length > 0
      ? athlete.trainingGroups.join(", ")
      : athlete.trainingGroup || athlete.practiceGroup || "—";

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
                <Badge variant={statusVariant(athlete.status)} className="capitalize">
                  {athlete.status}
                </Badge>
              </div>
              <SheetDescription>
                {athlete.gender} · Age {athlete.age}
              </SheetDescription>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-muted-foreground font-mono text-xs">
                  {athlete.id.slice(0, 8)}…
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  title="Copy swimmer ID"
                  onClick={() => navigator.clipboard.writeText(athlete.id)}
                >
                  <CopyIcon />
                  <span className="sr-only">Copy swimmer ID</span>
                </Button>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Profile</h3>
            <dl className="flex flex-col gap-3 text-sm">
              <DetailRow
                label="Birthday"
                value={formatBirthday(athlete.dateOfBirth)}
              />
              <DetailRow label="Gender" value={athlete.gender} />
              <DetailRow label="Age" value={athlete.age || "—"} />
              <DetailRow label="Training group" value={groups} />
              {classLabel ? (
                <DetailRow label="Class" value={classLabel} />
              ) : null}
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
            </dl>
          </section>

          {athlete.parents.length > 0 ? (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Parents / guardians</h3>
                <ul className="flex flex-col gap-4">
                  {athlete.parents.map((parent) => (
                    <li key={`${parent.name}-${parent.email}`} className="flex flex-col gap-1">
                      <p className="font-medium">{parent.name}</p>
                      {parent.email ? (
                        <a
                          href={`mailto:${parent.email}`}
                          className="text-muted-foreground text-sm hover:underline"
                        >
                          {parent.email}
                        </a>
                      ) : null}
                      {parent.phone_number ? (
                        <a
                          href={`tel:${parent.phone_number}`}
                          className="text-muted-foreground text-sm hover:underline"
                        >
                          {parent.phone_number}
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {athlete.emergencyContacts.length > 0 ? (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Emergency contacts</h3>
                <ul className="flex flex-col gap-4">
                  {athlete.emergencyContacts.map((contact) => (
                    <li
                      key={`${contact.name}_${contact.phone_number}`}
                      className="flex flex-col gap-1"
                    >
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {contact.relationship}
                      </p>
                      <a
                        href={`tel:${contact.phone_number}`}
                        className="text-muted-foreground text-sm hover:underline"
                      >
                        {contact.phone_number}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {athlete.personalRecords.length > 0 ? (
            <>
              <Separator />
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Personal records</h3>
                <dl className="flex flex-col gap-3 text-sm">
                  {athlete.personalRecords.map((record) => (
                    <DetailRow
                      key={record.event}
                      label={record.event}
                      value={
                        <span className="font-timing">{record.time}</span>
                      }
                    />
                  ))}
                </dl>
              </section>
            </>
          ) : null}
        </div>

        <SheetFooter className="border-t sm:flex-row">
          <Link
            href={editHref}
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
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
