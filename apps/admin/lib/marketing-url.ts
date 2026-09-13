const DEV_MARKETING_URL = "http://localhost:3000";

/** Public marketing site — where users land after signing out of admin. */
export function getMarketingUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MARKETING_URL?.trim();
  if (configured) return configured;
  return DEV_MARKETING_URL;
}
