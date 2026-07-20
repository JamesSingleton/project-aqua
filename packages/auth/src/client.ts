import { polarClient } from "@polar-sh/better-auth/client";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { orgAc, orgRoles } from "./organization-ac";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3001",
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
} = authClient;
