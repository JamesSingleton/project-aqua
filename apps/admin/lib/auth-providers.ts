import { env } from "@/env";

export type SocialProvider = "google" | "microsoft";

/** Social providers configured via server env (safe to read on the server). */
export function getConfiguredSocialProviders(): SocialProvider[] {
  const providers: SocialProvider[] = [];
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push("google");
  }
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    providers.push("microsoft");
  }
  return providers;
}
