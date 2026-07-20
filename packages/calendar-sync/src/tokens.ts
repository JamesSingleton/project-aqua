import { db } from "@project-aqua/db/client";
import { account } from "@project-aqua/db/schema";
import { and, eq } from "drizzle-orm";

export async function getProviderTokens(
  userId: string,
  providerId: "google" | "microsoft",
) {
  const [row] = await db
    .select({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      scope: account.scope,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
    .limit(1);

  if (!row?.accessToken) {
    throw new Error(`${providerId} account is not linked`);
  }

  return row;
}

export type ExternalCalendarEvent = {
  id: string;
  etag?: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  status?: string;
};
