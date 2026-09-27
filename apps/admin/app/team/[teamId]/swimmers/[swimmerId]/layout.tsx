import { getSession } from "@lane4hq/auth/session";
import { requireSwimmerTeamAccess } from "@lane4hq/db/authz";
import { getSwimmerById } from "@lane4hq/db/queries/roster";
import { isMinorSwimmer } from "@lane4hq/swim-core/age";
import { Badge } from "@lane4hq/ui/components/badge";
import { notFound } from "next/navigation";
import { SetBreadcrumbEntity } from "@/components/breadcrumb-entities";
import { SwimmerNav } from "./swimmer-nav";

export default async function SwimmerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const session = await getSession();
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const swimmer = await getSwimmerById(swimmerId, teamId);
  if (!swimmer) notFound();

  const label =
    swimmer.preferredName?.trim() ||
    `${swimmer.firstName} ${swimmer.lastName}`.trim();
  const displayName = swimmer.preferredName
    ? `${swimmer.preferredName} (${swimmer.firstName} ${swimmer.lastName})`
    : `${swimmer.firstName} ${swimmer.lastName}`;
  const minor = isMinorSwimmer(swimmer.dateOfBirth);

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbEntity id={swimmerId} label={label} />
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          {minor && <Badge variant="outline">Minor</Badge>}
        </div>
        <p className="text-muted-foreground">
          {swimmer.gender === "male" ? "Male" : "Female"} ·{" "}
          {swimmer.groupName ?? swimmer.practiceGroup ?? "No practice group"}
          {swimmer.governingBodyId && <> · USA ID {swimmer.governingBodyId}</>}
        </p>
      </div>
      <SwimmerNav teamId={teamId} swimmerId={swimmerId} />
      {children}
    </div>
  );
}
