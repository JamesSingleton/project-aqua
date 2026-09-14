const DEV_MARKETING_URL = "http://localhost:3000";

/** Public marketing site — where users land after signing out of admin. */
export function getMarketingUrl(): string {
  // Read process.env directly so tests can override, and Next can inline NEXT_PUBLIC_*.
  const configured = process.env.NEXT_PUBLIC_MARKETING_URL?.trim();
  if (configured) return configured;
  return DEV_MARKETING_URL;
}
