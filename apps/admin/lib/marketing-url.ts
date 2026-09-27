const DEV_MARKETING_URL = "http://localhost:3000";
const PROD_MARKETING_URL = "https://www.lane4hq.com";

/** Public marketing site — where users land after signing out of admin. */
export function getMarketingUrl(): string {
  // Read process.env directly so tests can override, and Next can inline NEXT_PUBLIC_*.
  const configured = process.env.NEXT_PUBLIC_MARKETING_URL?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? PROD_MARKETING_URL
    : DEV_MARKETING_URL;
}
