import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./server";

/**
 * One Better Auth session lookup per request.
 *
 * Do not pin `aqua_app` / SET ROLE here. `bindRequestUser` reserves a single
 * postgres.js connection for the whole request, which serializes every
 * `Promise.all` query and can stall the pool until nothing renders.
 * Page/action authz stays in `requireTeamRole` / `requireTeamMember`.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
