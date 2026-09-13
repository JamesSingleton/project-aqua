"use client";

import { authClient } from "@project-aqua/auth/client";
import { getMarketingUrl } from "./marketing-url";

export type SignOutResult = { ok: true } | { ok: false; error: string };

/** End the admin session and leave the coach app for the public marketing site. */
export async function signOutToMarketing(): Promise<SignOutResult> {
  const destination = getMarketingUrl();

  // Do not pass cross-origin callbackURL — Better Auth validates it against
  // trustedOrigins (admin :3001 only in dev). Redirect to marketing client-side.
  const result = await authClient.signOut();

  if (result.error) {
    return {
      ok: false,
      error: result.error.message ?? "Could not sign out",
    };
  }

  const providerLogoutUrl = result.data?.url;
  if (providerLogoutUrl && result.data?.redirect) {
    window.location.replace(providerLogoutUrl);
    return { ok: true };
  }

  window.location.replace(destination);
  return { ok: true };
}
