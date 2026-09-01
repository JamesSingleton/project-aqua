import { polarClient } from "@polar-sh/better-auth/client";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { orgAc, orgRoles } from "./organization-ac";

function resolveAuthBaseURL() {
  // Same-origin in the browser so sign-in works on LAN IPs, not only localhost.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
}

const authBaseURL = resolveAuthBaseURL();

export const authClient = createAuthClient({
  ...(authBaseURL ? { baseURL: authBaseURL } : {}),
  plugins: [
    organizationClient({
      ac: orgAc,
      roles: orgRoles,
    }),
    polarClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa";
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  twoFactor,
  changePassword,
  updateUser,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  revokeSession,
  revokeSessions,
} = authClient;
