import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationTeamType,
  requireSwimmerTeamAccess,
} from "@project-aqua/db/authz";
import { listTrainingGroups } from "@project-aqua/db/queries/groups";
import {
  getSwimmerById,
  getSwimmerContactsForMembership,
  getSwimmerMedicalForMembership,
} from "@project-aqua/db/queries/roster";
import { supportsClassYear } from "@project-aqua/swim-core/team-types";
import { notFound } from "next/navigation";
import { EditSwimmerForm } from "./edit-swimmer-form";

export default async function EditSwimmerPage({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const session = await getSession();
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const swimmer = await getSwimmerById(swimmerId, teamId);
  if (!swimmer) notFound();

  const [contacts, medical, teamType, groups] = await Promise.all([
    getSwimmerContactsForMembership(swimmer.membershipId, teamId),
    getSwimmerMedicalForMembership(swimmer.membershipId, teamId),
    getOrganizationTeamType(teamId),
    listTrainingGroups(teamId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit swimmer</h1>
        <p className="text-muted-foreground">
          {swimmer.firstName} {swimmer.lastName}
        </p>
      </div>
      <EditSwimmerForm
        teamId={teamId}
        swimmerId={swimmerId}
        showClassYear={supportsClassYear(teamType)}
        groups={groups.map((group) => ({ id: group.id, name: group.name }))}
        groupId={swimmer.groupId}
        defaultValues={{
          firstName: swimmer.firstName,
          middleName: swimmer.middleName ?? undefined,
          lastName: swimmer.lastName,
          preferredName: swimmer.preferredName ?? undefined,
          dateOfBirth: swimmer.dateOfBirth,
          gender: swimmer.gender,
          email: swimmer.email ?? "",
          phone: swimmer.phone ?? undefined,
          practiceGroup: undefined,
          classYear:
            (swimmer.classYear as "FR" | "SO" | "JR" | "SR" | null) ??
            undefined,
          usaMemberId: swimmer.governingBodyId ?? undefined,
          contacts: contacts
            ? {
                parentName: contacts.parentName ?? undefined,
                parentEmail: contacts.parentEmail ?? undefined,
                parentPhone: contacts.parentPhone ?? undefined,
                emergencyName: contacts.emergencyName ?? undefined,
                emergencyPhone: contacts.emergencyPhone ?? undefined,
              }
            : undefined,
          medical: medical
            ? {
                allergies: medical.allergies ?? undefined,
                medications: medical.medications ?? undefined,
                conditions: medical.conditions ?? undefined,
                notes: medical.notes ?? undefined,
              }
            : undefined,
        }}
      />
    </div>
  );
}
