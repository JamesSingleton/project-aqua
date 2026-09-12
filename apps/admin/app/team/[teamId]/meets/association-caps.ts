import { getOrganizationAssociationCaps } from "@project-aqua/db/authz";
import {
  type AssociationEventCaps,
  resolveAssociationEventCaps,
} from "@project-aqua/swim-core/association-event-caps";

export async function resolvedAssociationCapsForMeet(
  teamId: string,
  meet: {
    maxScoringEntriesPerIndividualEvent?: number | null;
    maxRelayTeamsPerEvent?: number | null;
  },
): Promise<AssociationEventCaps> {
  const team = await getOrganizationAssociationCaps(teamId);
  return resolveAssociationEventCaps(team, {
    maxScoringEntriesPerIndividualEvent:
      meet.maxScoringEntriesPerIndividualEvent,
    maxRelayTeamsPerEvent: meet.maxRelayTeamsPerEvent,
  });
}
