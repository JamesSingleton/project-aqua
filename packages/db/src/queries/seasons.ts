import {
  currentSeasonRange,
  nextSeasonRange,
  seasonRangeFromLabel,
} from "@project-aqua/swim-core/age";
import type {
  AcademicStanding,
  ClassYear,
  EligibilityStatus,
} from "@project-aqua/swim-core/team-types";
import {
  advanceAcademicStanding,
  advanceClassYear,
  advanceSeasonsOfCompetitionUsed,
  parseAcademicStanding,
  parseClassYear,
  parseEligibilityStatus,
} from "@project-aqua/swim-core/team-types";
import { and, asc, desc, eq, ilike, notInArray, or } from "drizzle-orm";
import { db } from "../client";
import { seasonEnrollments, teamSeasons } from "../schema/seasons";
import { swimmers, teamSwimmerMemberships } from "../schema/swimmers";

function generateId(): string {
  return crypto.randomUUID();
}

export type TeamSeason = typeof teamSeasons.$inferSelect;

export async function listTeamSeasons(organizationId: string) {
  return db
    .select()
    .from(teamSeasons)
    .where(eq(teamSeasons.organizationId, organizationId))
    .orderBy(desc(teamSeasons.startsOn));
}

export async function getSeasonById(
  seasonId: string,
  organizationId: string,
): Promise<TeamSeason | null> {
  const [row] = await db
    .select()
    .from(teamSeasons)
    .where(
      and(
        eq(teamSeasons.id, seasonId),
        eq(teamSeasons.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getCurrentSeason(
  organizationId: string,
): Promise<TeamSeason | null> {
  const [row] = await db
    .select()
    .from(teamSeasons)
    .where(
      and(
        eq(teamSeasons.organizationId, organizationId),
        eq(teamSeasons.isCurrent, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Ensure the org has a current season; create one from the USA season calendar if missing. */
export async function ensureCurrentSeason(
  organizationId: string,
): Promise<TeamSeason> {
  const existing = await getCurrentSeason(organizationId);
  if (existing) return existing;

  const range = currentSeasonRange();
  const [byLabel] = await db
    .select()
    .from(teamSeasons)
    .where(
      and(
        eq(teamSeasons.organizationId, organizationId),
        eq(teamSeasons.label, range.label),
      ),
    )
    .limit(1);

  if (byLabel) {
    await setCurrentSeason(organizationId, byLabel.id);
    return { ...byLabel, isCurrent: true };
  }

  return createSeason(organizationId, {
    label: range.label,
    startsOn: range.startsOn,
    endsOn: range.endsOn,
    makeCurrent: true,
  });
}

export async function createSeason(
  organizationId: string,
  input: {
    label: string;
    startsOn: string;
    endsOn: string;
    makeCurrent?: boolean;
  },
): Promise<TeamSeason> {
  const id = generateId();
  const makeCurrent = input.makeCurrent ?? false;

  await db.transaction(async (tx) => {
    if (makeCurrent) {
      await tx
        .update(teamSeasons)
        .set({ isCurrent: false, updatedAt: new Date() })
        .where(eq(teamSeasons.organizationId, organizationId));
    }

    await tx.insert(teamSeasons).values({
      id,
      organizationId,
      label: input.label,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      isCurrent: makeCurrent,
    });
  });

  const season = await getSeasonById(id, organizationId);
  if (!season) throw new Error("Failed to create season");
  return season;
}

export async function setCurrentSeason(
  organizationId: string,
  seasonId: string,
) {
  const season = await getSeasonById(seasonId, organizationId);
  if (!season) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(teamSeasons)
      .set({ isCurrent: false, updatedAt: new Date() })
      .where(eq(teamSeasons.organizationId, organizationId));
    await tx
      .update(teamSeasons)
      .set({ isCurrent: true, updatedAt: new Date() })
      .where(eq(teamSeasons.id, seasonId));
  });

  return true;
}

export type SeasonEnrollmentInput = {
  membershipId: string;
  groupId?: string | null;
  classYear?: string | null;
  academicStanding?: string | null;
  eligibilityStatus?: string | null;
  seasonsOfCompetitionUsed?: number | null;
  eligibilityNotes?: string | null;
  status?: "active" | "inactive";
};

export async function enrollMembershipInSeason(
  seasonId: string,
  input: SeasonEnrollmentInput,
) {
  const id = generateId();
  await db.insert(seasonEnrollments).values({
    id,
    seasonId,
    membershipId: input.membershipId,
    groupId: input.groupId ?? null,
    classYear: parseClassYear(input.classYear) ?? null,
    academicStanding: parseAcademicStanding(input.academicStanding) ?? null,
    eligibilityStatus: parseEligibilityStatus(input.eligibilityStatus) ?? null,
    seasonsOfCompetitionUsed: input.seasonsOfCompetitionUsed ?? null,
    eligibilityNotes: input.eligibilityNotes ?? null,
    status: input.status ?? "active",
  });
  return id;
}

export async function updateSeasonEnrollment(
  enrollmentId: string,
  organizationId: string,
  data: Partial<{
    groupId: string | null;
    classYear: string | null;
    academicStanding: string | null;
    eligibilityStatus: string | null;
    seasonsOfCompetitionUsed: number | null;
    eligibilityNotes: string | null;
    status: "active" | "inactive";
    leftAt: Date | null;
  }>,
) {
  const [row] = await db
    .select({ id: seasonEnrollments.id })
    .from(seasonEnrollments)
    .innerJoin(teamSeasons, eq(seasonEnrollments.seasonId, teamSeasons.id))
    .where(
      and(
        eq(seasonEnrollments.id, enrollmentId),
        eq(teamSeasons.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) return false;

  await db
    .update(seasonEnrollments)
    .set({
      ...(data.groupId !== undefined && { groupId: data.groupId }),
      ...(data.classYear !== undefined && {
        classYear: parseClassYear(data.classYear),
      }),
      ...(data.academicStanding !== undefined && {
        academicStanding: parseAcademicStanding(data.academicStanding),
      }),
      ...(data.eligibilityStatus !== undefined && {
        eligibilityStatus: parseEligibilityStatus(data.eligibilityStatus),
      }),
      ...(data.seasonsOfCompetitionUsed !== undefined && {
        seasonsOfCompetitionUsed: data.seasonsOfCompetitionUsed,
      }),
      ...(data.eligibilityNotes !== undefined && {
        eligibilityNotes: data.eligibilityNotes,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.leftAt !== undefined && { leftAt: data.leftAt }),
      updatedAt: new Date(),
    })
    .where(eq(seasonEnrollments.id, enrollmentId));

  return true;
}

export type SeasonRollPreviewRow = {
  membershipId: string;
  swimmerId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  gender: "male" | "female";
  priorClassYear: string | null;
  proposedClassYear: string | null;
  priorAcademicStanding: string | null;
  proposedAcademicStanding: string | null;
  priorEligibilityStatus: string | null;
  proposedEligibilityStatus: string | null;
  priorSeasonsUsed: number | null;
  proposedSeasonsUsed: number | null;
  groupId: string | null;
  defaultSelected: boolean;
  reasonExcluded: "graduated" | null;
};

export async function previewSeasonRoll(
  organizationId: string,
  sourceSeasonId: string,
): Promise<{
  sourceSeason: TeamSeason;
  proposedSeason: { label: string; startsOn: string; endsOn: string };
  rows: SeasonRollPreviewRow[];
}> {
  const sourceSeason = await getSeasonById(sourceSeasonId, organizationId);
  if (!sourceSeason) throw new Error("Source season not found");

  const proposed =
    nextSeasonRange(sourceSeason.label) ??
    (() => {
      const fallback = currentSeasonRange();
      return (
        nextSeasonRange(fallback.label) ?? {
          label: fallback.label,
          startsOn: fallback.startsOn,
          endsOn: fallback.endsOn,
        }
      );
    })();

  const rowsJoined = await db
    .select({
      membershipId: seasonEnrollments.membershipId,
      swimmerId: swimmers.id,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      preferredName: swimmers.preferredName,
      gender: swimmers.gender,
      classYear: seasonEnrollments.classYear,
      academicStanding: seasonEnrollments.academicStanding,
      eligibilityStatus: seasonEnrollments.eligibilityStatus,
      seasonsOfCompetitionUsed: seasonEnrollments.seasonsOfCompetitionUsed,
      groupId: seasonEnrollments.groupId,
    })
    .from(seasonEnrollments)
    .innerJoin(
      teamSwimmerMemberships,
      eq(seasonEnrollments.membershipId, teamSwimmerMemberships.id),
    )
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(
      and(
        eq(seasonEnrollments.seasonId, sourceSeasonId),
        eq(seasonEnrollments.status, "active"),
      ),
    )
    .orderBy(asc(swimmers.lastName), asc(swimmers.firstName));

  const rows: SeasonRollPreviewRow[] = rowsJoined.map((row) => {
    const priorClass = parseClassYear(row.classYear);
    const isSenior = priorClass === "SR";
    const proposedClass = advanceClassYear(priorClass);
    const priorStanding = parseAcademicStanding(row.academicStanding);
    const priorElig = parseEligibilityStatus(row.eligibilityStatus);

    return {
      membershipId: row.membershipId,
      swimmerId: row.swimmerId,
      firstName: row.firstName,
      lastName: row.lastName,
      preferredName: row.preferredName,
      gender: row.gender,
      priorClassYear: priorClass,
      proposedClassYear: proposedClass,
      priorAcademicStanding: priorStanding,
      proposedAcademicStanding: advanceAcademicStanding(priorStanding),
      priorEligibilityStatus: priorElig,
      proposedEligibilityStatus: priorElig ?? "competing",
      priorSeasonsUsed: row.seasonsOfCompetitionUsed,
      proposedSeasonsUsed: advanceSeasonsOfCompetitionUsed(
        row.seasonsOfCompetitionUsed,
        priorElig,
      ),
      groupId: row.groupId,
      defaultSelected: !isSenior,
      reasonExcluded: isSenior ? "graduated" : null,
    };
  });

  return { sourceSeason, proposedSeason: proposed, rows };
}

export type CommitSeasonRollInput = {
  sourceSeasonId: string;
  label: string;
  startsOn: string;
  endsOn: string;
  makeCurrent: boolean;
  enrollments: Array<{
    membershipId: string;
    groupId?: string | null;
    classYear?: string | null;
    academicStanding?: string | null;
    eligibilityStatus?: string | null;
    seasonsOfCompetitionUsed?: number | null;
    eligibilityNotes?: string | null;
  }>;
};

export async function commitSeasonRoll(
  organizationId: string,
  input: CommitSeasonRollInput,
): Promise<TeamSeason> {
  const range =
    seasonRangeFromLabel(input.label) ??
    ({
      label: input.label,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
    } as const);

  const season = await createSeason(organizationId, {
    label: range.label,
    startsOn: input.startsOn || range.startsOn,
    endsOn: input.endsOn || range.endsOn,
    makeCurrent: input.makeCurrent,
  });

  if (input.enrollments.length > 0) {
    await db.insert(seasonEnrollments).values(
      input.enrollments.map((e) => ({
        id: generateId(),
        seasonId: season.id,
        membershipId: e.membershipId,
        groupId: e.groupId ?? null,
        classYear: parseClassYear(e.classYear) ?? null,
        academicStanding: parseAcademicStanding(e.academicStanding) ?? null,
        eligibilityStatus: parseEligibilityStatus(e.eligibilityStatus) ?? null,
        seasonsOfCompetitionUsed: e.seasonsOfCompetitionUsed ?? null,
        eligibilityNotes: e.eligibilityNotes ?? null,
        status: "active" as const,
      })),
    );
  }

  return season;
}

export async function getEnrollmentForMembershipInSeason(
  membershipId: string,
  seasonId: string,
) {
  const [row] = await db
    .select()
    .from(seasonEnrollments)
    .where(
      and(
        eq(seasonEnrollments.membershipId, membershipId),
        eq(seasonEnrollments.seasonId, seasonId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listMembershipsNotInSeason(
  organizationId: string,
  seasonId: string,
  q?: string,
) {
  const enrolled = await db
    .select({ membershipId: seasonEnrollments.membershipId })
    .from(seasonEnrollments)
    .where(eq(seasonEnrollments.seasonId, seasonId));

  const enrolledIds = enrolled.map((e) => e.membershipId);

  const conditions = [
    eq(teamSwimmerMemberships.organizationId, organizationId),
  ];
  if (enrolledIds.length > 0) {
    conditions.push(notInArray(teamSwimmerMemberships.id, enrolledIds));
  }

  if (q?.trim()) {
    const pattern = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(swimmers.firstName, pattern),
        ilike(swimmers.lastName, pattern),
        ilike(swimmers.preferredName, pattern),
      )!,
    );
  }

  return db
    .select({
      membershipId: teamSwimmerMemberships.id,
      swimmerId: swimmers.id,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      preferredName: swimmers.preferredName,
      gender: swimmers.gender,
      status: teamSwimmerMemberships.status,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(and(...conditions))
    .orderBy(asc(swimmers.lastName), asc(swimmers.firstName))
    .limit(50);
}

export type { AcademicStanding, ClassYear, EligibilityStatus };
