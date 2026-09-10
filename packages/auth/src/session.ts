import { headers } from "next/headers";
import { after } from "next/server";
import { bindRequestUser, unbindRequestUser } from "@project-aqua/db/client";
import { auth } from "./server";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user?.id) {
    await bindRequestUser(session.user.id);
    after(() => {
      void unbindRequestUser();
    });
  }

  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
