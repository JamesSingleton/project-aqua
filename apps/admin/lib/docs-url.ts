const DEV_DOCS_URL = "http://localhost:3004";

/** Public coach documentation hosted by Mintlify. */
export function getDocsUrl(): string {
  // Read process.env directly so tests can override, and Next can inline NEXT_PUBLIC_*.
  const configured = process.env.NEXT_PUBLIC_DOCS_URL?.trim();
  if (configured) return configured;
  return DEV_DOCS_URL;
}
