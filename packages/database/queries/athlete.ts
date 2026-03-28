import { and, asc, eq } from "drizzle-orm";
import { database } from "../index";
import {
  type Athlete,
  athletes,
  type TeamAthlete,
  teamAthletes,
  teams,
} from "../schema";

export interface TeamAthleteRow {
  athlete: Athlete;
  membership: TeamAthlete;
}

/**
 * Get all athletes on a team by the team's public ID.
 * Returns athlete identity + their team-specific membership data (status,
 * training group, grade year, jersey number, etc.).
 */
export async function getAthletesByPublicId(
  publicId: string
): Promise<TeamAthleteRow[]> {
  const rows = await database
    .select({
      athlete: athletes,
      membership: teamAthletes,
    })
    .from(teams)
    .innerJoin(
      teamAthletes,
      eq(teamAthletes.organizationId, teams.organizationId)
    )
    .innerJoin(athletes, eq(athletes.id, teamAthletes.athleteId))
    .where(eq(teams.publicId, publicId))
    .orderBy(asc(athletes.lastName), asc(athletes.firstName));

  return rows;
}

/**
 * Get only active athletes on a team.
 */
export async function getActiveAthletesByPublicId(
  publicId: string
): Promise<TeamAthleteRow[]> {
  const rows = await database
    .select({
      athlete: athletes,
      membership: teamAthletes,
    })
    .from(teams)
    .innerJoin(
      teamAthletes,
      eq(teamAthletes.organizationId, teams.organizationId)
    )
    .innerJoin(athletes, eq(athletes.id, teamAthletes.athleteId))
    .where(and(eq(teams.publicId, publicId), eq(teamAthletes.status, "active")))
    .orderBy(asc(athletes.lastName), asc(athletes.firstName));

  return rows;
}

/**
 * Get athletes filtered by training group (club teams).
 * e.g. getAthletesByTrainingGroup('az-azsl', 'Blue')
 */
export async function getAthletesByTrainingGroup(
  publicId: string,
  trainingGroup: string
): Promise<TeamAthleteRow[]> {
  const rows = await database
    .select({
      athlete: athletes,
      membership: teamAthletes,
    })
    .from(teams)
    .innerJoin(
      teamAthletes,
      eq(teamAthletes.organizationId, teams.organizationId)
    )
    .innerJoin(athletes, eq(athletes.id, teamAthletes.athleteId))
    .where(
      and(
        eq(teams.publicId, publicId),
        eq(teamAthletes.trainingGroup, trainingGroup),
        eq(teamAthletes.status, "active")
      )
    )
    .orderBy(asc(athletes.lastName), asc(athletes.firstName));

  return rows;
}

/**
 * Get athletes filtered by grade year (HS/college teams).
 * e.g. getAthletesByGradeYear('az-mari', 'SR')
 */
export async function getAthletesByGradeYear(
  publicId: string,
  gradeYear: "FR" | "SO" | "JR" | "SR"
): Promise<TeamAthleteRow[]> {
  const rows = await database
    .select({
      athlete: athletes,
      membership: teamAthletes,
    })
    .from(teams)
    .innerJoin(
      teamAthletes,
      eq(teamAthletes.organizationId, teams.organizationId)
    )
    .innerJoin(athletes, eq(athletes.id, teamAthletes.athleteId))
    .where(
      and(
        eq(teams.publicId, publicId),
        eq(teamAthletes.gradeYear, gradeYear),
        eq(teamAthletes.status, "active")
      )
    )
    .orderBy(asc(athletes.lastName), asc(athletes.firstName));

  return rows;
}

/**
 * Get a single athlete's full profile including their membership
 * data for a specific team.
 */
export async function getAthleteByIdForTeam(
  publicId: string,
  athleteId: string
): Promise<TeamAthleteRow | null> {
  const rows = await database
    .select({
      athlete: athletes,
      membership: teamAthletes,
    })
    .from(teams)
    .innerJoin(
      teamAthletes,
      eq(teamAthletes.organizationId, teams.organizationId)
    )
    .innerJoin(athletes, eq(athletes.id, teamAthletes.athleteId))
    .where(and(eq(teams.publicId, publicId), eq(athletes.id, athleteId)))
    .limit(1);

  return rows[0] ?? null;
}
