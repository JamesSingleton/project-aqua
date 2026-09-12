import { swimmerIdentitiesMatch } from "@project-aqua/swim-core/people";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../client";
import { attendanceRecords } from "../schema/attendance";
import {
  meetCommitments,
  meetEntries,
  meetRelayLegs,
  meetRelayResultSplits,
  meetResults,
  swimmerBestTimes,
  swimmerTimeEntries,
} from "../schema/meets";
import { maappAcknowledgments } from "../schema/safesport";
import { seasonEnrollments } from "../schema/seasons";
import {
  swimmerClubRegistrations,
  swimmerContacts,
  swimmerMedical,
  swimmers,
  teamSwimmerMemberships,
} from "../schema/swimmers";
import { recomputeBestTimesForSwimmer } from "./progression";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function contactsAreEmpty(
  row: typeof swimmerContacts.$inferSelect | undefined,
): boolean {
  if (!row) return true;
  return !(
    row.parentName ||
    row.parentEmail ||
    row.parentPhone ||
    row.emergencyName ||
    row.emergencyPhone ||
    row.addressLine1 ||
    row.city
  );
}

function medicalAreEmpty(
  row: typeof swimmerMedical.$inferSelect | undefined,
): boolean {
  if (!row) return true;
  return !(row.allergies || row.medications || row.conditions || row.notes);
}

async function transferMembershipChildren(
  tx: Tx,
  loserMembershipId: string,
  winnerMembershipId: string,
  winnerSwimmerId: string,
) {
  if (loserMembershipId === winnerMembershipId) return;

  const loserEnrollments = await tx
    .select()
    .from(seasonEnrollments)
    .where(eq(seasonEnrollments.membershipId, loserMembershipId));
  for (const enrollment of loserEnrollments) {
    const [winnerEnrollment] = await tx
      .select()
      .from(seasonEnrollments)
      .where(
        and(
          eq(seasonEnrollments.seasonId, enrollment.seasonId),
          eq(seasonEnrollments.membershipId, winnerMembershipId),
        ),
      )
      .limit(1);
    if (winnerEnrollment) {
      await tx
        .update(seasonEnrollments)
        .set({
          groupId: enrollment.groupId ?? winnerEnrollment.groupId,
          classYear: enrollment.classYear ?? winnerEnrollment.classYear,
          academicStanding:
            enrollment.academicStanding ?? winnerEnrollment.academicStanding,
          eligibilityStatus:
            enrollment.eligibilityStatus ?? winnerEnrollment.eligibilityStatus,
          seasonsOfCompetitionUsed:
            enrollment.seasonsOfCompetitionUsed ??
            winnerEnrollment.seasonsOfCompetitionUsed,
          eligibilityNotes:
            enrollment.eligibilityNotes ?? winnerEnrollment.eligibilityNotes,
          status:
            enrollment.status === "active" ? "active" : winnerEnrollment.status,
          updatedAt: new Date(),
        })
        .where(eq(seasonEnrollments.id, winnerEnrollment.id));
      await tx
        .delete(seasonEnrollments)
        .where(eq(seasonEnrollments.id, enrollment.id));
    } else {
      await tx
        .update(seasonEnrollments)
        .set({ membershipId: winnerMembershipId, updatedAt: new Date() })
        .where(eq(seasonEnrollments.id, enrollment.id));
    }
  }

  const loserCommitments = await tx
    .select()
    .from(meetCommitments)
    .where(eq(meetCommitments.membershipId, loserMembershipId));
  for (const commitment of loserCommitments) {
    const [winnerCommitment] = await tx
      .select({ id: meetCommitments.id })
      .from(meetCommitments)
      .where(
        and(
          eq(meetCommitments.meetId, commitment.meetId),
          eq(meetCommitments.membershipId, winnerMembershipId),
        ),
      )
      .limit(1);
    if (winnerCommitment) {
      await tx
        .delete(meetCommitments)
        .where(eq(meetCommitments.id, commitment.id));
    } else {
      await tx
        .update(meetCommitments)
        .set({ membershipId: winnerMembershipId, updatedAt: new Date() })
        .where(eq(meetCommitments.id, commitment.id));
    }
  }

  const loserMaapp = await tx
    .select()
    .from(maappAcknowledgments)
    .where(eq(maappAcknowledgments.membershipId, loserMembershipId));
  for (const ack of loserMaapp) {
    const [winnerAck] = await tx
      .select({ id: maappAcknowledgments.id })
      .from(maappAcknowledgments)
      .where(
        and(
          eq(maappAcknowledgments.membershipId, winnerMembershipId),
          eq(maappAcknowledgments.seasonId, ack.seasonId),
        ),
      )
      .limit(1);
    if (winnerAck) {
      await tx
        .delete(maappAcknowledgments)
        .where(eq(maappAcknowledgments.id, ack.id));
    } else {
      await tx
        .update(maappAcknowledgments)
        .set({ membershipId: winnerMembershipId })
        .where(eq(maappAcknowledgments.id, ack.id));
    }
  }

  await tx
    .update(meetEntries)
    .set({ membershipId: winnerMembershipId })
    .where(eq(meetEntries.membershipId, loserMembershipId));
  await tx
    .update(meetRelayLegs)
    .set({ membershipId: winnerMembershipId })
    .where(eq(meetRelayLegs.membershipId, loserMembershipId));
  await tx
    .update(meetRelayResultSplits)
    .set({ membershipId: winnerMembershipId })
    .where(eq(meetRelayResultSplits.membershipId, loserMembershipId));
  await tx
    .update(attendanceRecords)
    .set({ membershipId: winnerMembershipId })
    .where(eq(attendanceRecords.membershipId, loserMembershipId));
  await tx
    .update(swimmerTimeEntries)
    .set({
      membershipId: winnerMembershipId,
      swimmerId: winnerSwimmerId,
    })
    .where(eq(swimmerTimeEntries.membershipId, loserMembershipId));

  const [loserContacts] = await tx
    .select()
    .from(swimmerContacts)
    .where(eq(swimmerContacts.membershipId, loserMembershipId))
    .limit(1);
  const [winnerContacts] = await tx
    .select()
    .from(swimmerContacts)
    .where(eq(swimmerContacts.membershipId, winnerMembershipId))
    .limit(1);
  if (loserContacts) {
    if (!winnerContacts) {
      await tx.insert(swimmerContacts).values({
        ...loserContacts,
        membershipId: winnerMembershipId,
      });
    } else if (
      contactsAreEmpty(winnerContacts) &&
      !contactsAreEmpty(loserContacts)
    ) {
      const { membershipId: _m, ...fields } = loserContacts;
      await tx
        .update(swimmerContacts)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(swimmerContacts.membershipId, winnerMembershipId));
    }
    await tx
      .delete(swimmerContacts)
      .where(eq(swimmerContacts.membershipId, loserMembershipId));
  }

  const [loserMedical] = await tx
    .select()
    .from(swimmerMedical)
    .where(eq(swimmerMedical.membershipId, loserMembershipId))
    .limit(1);
  const [winnerMedical] = await tx
    .select()
    .from(swimmerMedical)
    .where(eq(swimmerMedical.membershipId, winnerMembershipId))
    .limit(1);
  if (loserMedical) {
    if (!winnerMedical) {
      await tx.insert(swimmerMedical).values({
        ...loserMedical,
        membershipId: winnerMembershipId,
      });
    } else if (
      medicalAreEmpty(winnerMedical) &&
      !medicalAreEmpty(loserMedical)
    ) {
      const { membershipId: _m, ...fields } = loserMedical;
      await tx
        .update(swimmerMedical)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(swimmerMedical.membershipId, winnerMembershipId));
    }
    await tx
      .delete(swimmerMedical)
      .where(eq(swimmerMedical.membershipId, loserMembershipId));
  }

  const [loserReg] = await tx
    .select()
    .from(swimmerClubRegistrations)
    .where(eq(swimmerClubRegistrations.membershipId, loserMembershipId))
    .limit(1);
  const [winnerReg] = await tx
    .select()
    .from(swimmerClubRegistrations)
    .where(eq(swimmerClubRegistrations.membershipId, winnerMembershipId))
    .limit(1);
  if (loserReg) {
    if (!winnerReg) {
      await tx
        .update(swimmerClubRegistrations)
        .set({ membershipId: winnerMembershipId, updatedAt: new Date() })
        .where(eq(swimmerClubRegistrations.id, loserReg.id));
    } else {
      await tx
        .delete(swimmerClubRegistrations)
        .where(eq(swimmerClubRegistrations.id, loserReg.id));
    }
  }
}

/**
 * Collapse duplicate person `loserSwimmerId` into canonical `winnerSwimmerId`.
 * Repoints memberships and person-scoped times/results, then deletes the loser.
 */
export async function mergeSwimmerRecords(input: {
  winnerSwimmerId: string;
  loserSwimmerId: string;
}): Promise<void> {
  const { winnerSwimmerId, loserSwimmerId } = input;
  if (winnerSwimmerId === loserSwimmerId) {
    throw new Error("Cannot merge a swimmer into themselves");
  }

  await db.transaction(async (tx) => {
    const [winner, loser] = await Promise.all([
      tx
        .select()
        .from(swimmers)
        .where(eq(swimmers.id, winnerSwimmerId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      tx
        .select()
        .from(swimmers)
        .where(eq(swimmers.id, loserSwimmerId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    ]);
    if (!winner || !loser) {
      throw new Error("Swimmer not found for merge");
    }

    const loserMemberships = await tx
      .select()
      .from(teamSwimmerMemberships)
      .where(eq(teamSwimmerMemberships.swimmerId, loserSwimmerId));

    for (const loserMembership of loserMemberships) {
      const [winnerMembership] = await tx
        .select()
        .from(teamSwimmerMemberships)
        .where(
          and(
            eq(
              teamSwimmerMemberships.organizationId,
              loserMembership.organizationId,
            ),
            eq(teamSwimmerMemberships.swimmerId, winnerSwimmerId),
          ),
        )
        .limit(1);

      if (winnerMembership) {
        await transferMembershipChildren(
          tx,
          loserMembership.id,
          winnerMembership.id,
          winnerSwimmerId,
        );
        await tx
          .delete(teamSwimmerMemberships)
          .where(eq(teamSwimmerMemberships.id, loserMembership.id));
      } else {
        await tx
          .update(teamSwimmerMemberships)
          .set({ swimmerId: winnerSwimmerId, updatedAt: new Date() })
          .where(eq(teamSwimmerMemberships.id, loserMembership.id));
        await tx
          .update(swimmerTimeEntries)
          .set({ swimmerId: winnerSwimmerId })
          .where(eq(swimmerTimeEntries.membershipId, loserMembership.id));
      }
    }

    await tx
      .update(meetResults)
      .set({ swimmerId: winnerSwimmerId })
      .where(eq(meetResults.swimmerId, loserSwimmerId));
    await tx
      .delete(swimmerBestTimes)
      .where(eq(swimmerBestTimes.swimmerId, loserSwimmerId));

    const winnerNeedsUsa =
      !winner.governingBodyId && Boolean(loser.governingBodyId);
    await tx
      .update(swimmers)
      .set({
        preferredName: winner.preferredName || loser.preferredName,
        middleName: winner.middleName || loser.middleName,
        email: winner.email || loser.email,
        phone: winner.phone || loser.phone,
        ...(winnerNeedsUsa
          ? {
              governingBody: loser.governingBody,
              governingBodyId: loser.governingBodyId,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(swimmers.id, winnerSwimmerId));

    await tx.delete(swimmers).where(eq(swimmers.id, loserSwimmerId));
  });

  await recomputeBestTimesForSwimmer(winnerSwimmerId);
}

/** Active roster people on a team matching identity, excluding one swimmer id. */
export async function findTeamSwimmersMatchingIdentity(
  organizationId: string,
  identity: {
    firstName: string;
    lastName: string;
    preferredName?: string | null;
    dateOfBirth: string;
  },
  excludeSwimmerId?: string,
) {
  const conditions = [
    eq(teamSwimmerMemberships.organizationId, organizationId),
    eq(teamSwimmerMemberships.status, "active"),
  ];
  if (excludeSwimmerId) {
    conditions.push(ne(swimmers.id, excludeSwimmerId));
  }

  const rows = await db
    .select({
      swimmerId: swimmers.id,
      membershipId: teamSwimmerMemberships.id,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      preferredName: swimmers.preferredName,
      dateOfBirth: swimmers.dateOfBirth,
      gender: swimmers.gender,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(and(...conditions));

  return rows.filter((row) =>
    swimmerIdentitiesMatch(identity, {
      firstName: row.firstName,
      lastName: row.lastName,
      preferredName: row.preferredName,
      dateOfBirth: row.dateOfBirth,
    }),
  );
}
