import { and, eq, gt } from "drizzle-orm";
import { db } from "../client";
import { session } from "../schema/auth";

/** Active Better Auth sessions for a user. Does not require a fresh session. */
export async function listActiveSessionsForUser(userId: string) {
  return db
    .select({
      id: session.id,
      token: session.token,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, new Date())));
}
