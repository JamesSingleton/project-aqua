import type { AttendanceStatus } from "@project-aqua/swim-core/validators";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../client.js";
import {
  attendanceRecords,
  practiceSessions,
  swimmers,
  teamSwimmerMemberships,
} from "../schema/index.js";

function generateId(): string {
  return crypto.randomUUID();
}

export async function getPracticeSessions(organizationId: string) {
  return db
    .select()
    .from(practiceSessions)
    .where(eq(practiceSessions.organizationId, organizationId))
    .orderBy(desc(practiceSessions.date));
}

export async function createPracticeSession(
  organizationId: string,
  data: { date: Date; location?: string; notes?: string },
) {
  const id = generateId();
  await db.insert(practiceSessions).values({
    id,
    organizationId,
    date: data.date,
    location: data.location ?? null,
    notes: data.notes ?? null,
  });
  return id;
}

export async function getAttendanceForSession(sessionId: string) {
  return db
    .select({
      recordId: attendanceRecords.id,
      membershipId: attendanceRecords.membershipId,
      status: attendanceRecords.status,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      practiceGroup: teamSwimmerMemberships.practiceGroup,
    })
    .from(attendanceRecords)
    .innerJoin(
      teamSwimmerMemberships,
      eq(attendanceRecords.membershipId, teamSwimmerMemberships.id),
    )
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(eq(attendanceRecords.practiceSessionId, sessionId));
}

export async function setAttendance(
  sessionId: string,
  membershipId: string,
  status: AttendanceStatus,
) {
  const existing = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.practiceSessionId, sessionId),
        eq(attendanceRecords.membershipId, membershipId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(attendanceRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, existing[0].id));
    return existing[0].id;
  }

  const id = generateId();
  await db.insert(attendanceRecords).values({
    id,
    practiceSessionId: sessionId,
    membershipId,
    status,
  });
  return id;
}

export async function getAttendanceSummary(organizationId: string) {
  const sessions = await getPracticeSessions(organizationId);
  const recent = sessions.slice(0, 5);
  const summaries = await Promise.all(
    recent.map(async (session) => {
      const records = await getAttendanceForSession(session.id);
      const present = records.filter((r) => r.status === "present").length;
      const total = records.length;
      return {
        sessionId: session.id,
        date: session.date,
        present,
        total,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }),
  );
  return summaries;
}
