export type SocialProvider = "google" | "microsoft";

/** Social providers configured via server env (safe to read on the server). */
export function getConfiguredSocialProviders(): SocialProvider[] {
  const providers: SocialProvider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push("google");
  }
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    providers.push("microsoft");
  }
  return providers;
}
