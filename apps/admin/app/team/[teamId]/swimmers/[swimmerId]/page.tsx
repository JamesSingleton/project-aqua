import { getSession } from "@project-aqua/auth/session";
import { requireSwimmerTeamAccess } from "@project-aqua/db/authz";
import {
  getClubRegistrationForMembership,
  getSwimmerAffiliations,
  getSwimmerById,
} from "@project-aqua/db/queries/roster";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SwimmerProfileTabs } from "./swimmer-profile-tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}): Promise<Metadata> {
  const { teamId, swimmerId } = await params;
  const swimmer = await getSwimmerById(swimmerId, teamId);
  const displayName =
    swimmer?.preferredName ?? `${swimmer?.firstName} ${swimmer?.lastName}`;
  return { title: displayName };
}

export default async function SwimmerProfilePage({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const session = await getSession();
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const [swimmer, affiliations] = await Promise.all([
    getSwimmerById(swimmerId, teamId),
    session?.user?.id
      ? getSwimmerAffiliations(swimmerId, session.user.id)
      : Promise.resolve([]),
  ]);

  if (!swimmer) notFound();

  const clubRegistration = await getClubRegistrationForMembership(
    swimmer.membershipId,
    teamId,
  );
  const minor = isMinorSwimmer(swimmer.dateOfBirth);

  return (
    <SwimmerProfileTabs
      teamId={teamId}
      swimmerId={swimmerId}
      membershipId={swimmer.membershipId}
      isMinor={minor}
      affiliations={affiliations}
      clubRegistration={clubRegistration}
    />
  );
}
