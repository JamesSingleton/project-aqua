"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@project-aqua/ui/components/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useBreadcrumbEntities } from "@/components/breadcrumb-entities";

const SEGMENT_LABELS: Record<string, string> = {
  roster: "Roster",
  calendar: "Calendar",
  attendance: "Attendance",
  workouts: "Workouts",
  meets: "Meets",
  import: "Import",
  results: "Results",
  "time-standards": "Time standards",
  registration: "Registration",
  events: "Events",
  progression: "Progression",
  analytics: "Analytics",
  settings: "Settings",
  members: "Members",
  billing: "Billing",
  account: "Account",
  safesport: "SafeSport",
  "usa-swimming": "USA Swimming",
  swimmers: "Swimmers",
  create: "Create",
  edit: "Edit",
};

const DYNAMIC_PARENT_LABELS: Record<string, string> = {
  meets: "Meet",
  swimmers: "Swimmer",
  workouts: "Workout",
  attendance: "Session",
  progression: "Swimmer",
};

function isDynamicSegment(segment: string) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      segment,
    ) || /^[a-z0-9]{20,}$/i.test(segment)
  );
}

function labelForSegment(
  segment: string,
  parent: string | undefined,
  entityLabels: ReadonlyMap<string, string>,
) {
  const entityLabel = entityLabels.get(segment);
  if (entityLabel) return entityLabel;
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }
  if (isDynamicSegment(segment) && parent && DYNAMIC_PARENT_LABELS[parent]) {
    return DYNAMIC_PARENT_LABELS[parent];
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TeamBreadcrumb({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const pathname = usePathname();
  const entityLabels = useBreadcrumbEntities();
  const teamRoot = `/team/${teamId}`;
  const relativePath = pathname.startsWith(teamRoot)
    ? pathname.slice(teamRoot.length)
    : "";
  const segments = relativePath.split("/").filter(Boolean);

  const crumbs = [
    { label: teamName, href: teamRoot },
    ...segments.map((segment, index) => {
      // Roster lives at /roster; /swimmers is only used for nested swimmer routes.
      const href =
        segment === "swimmers"
          ? `${teamRoot}/roster`
          : `${teamRoot}/${segments.slice(0, index + 1).join("/")}`;
      const parent = index > 0 ? segments[index - 1] : undefined;
      return {
        label: labelForSegment(segment, parent, entityLabels),
        href,
      };
    }),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const hideOnMobile = !isLast;

          return (
            <Fragment key={crumb.href}>
              {index > 0 ? (
                <BreadcrumbSeparator
                  className={hideOnMobile ? "hidden md:block" : undefined}
                />
              ) : null}
              <BreadcrumbItem
                className={hideOnMobile ? "hidden md:block" : undefined}
              >
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
