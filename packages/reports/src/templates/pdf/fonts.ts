/**
 * PDF fonts for report templates.
 *
 * We intentionally use the built-in Helvetica family (no remote Font.register)
 * so serverless renders and CI stay offline-safe. Midday loads Inter from a
 * CDN; we can swap to bundled TTF assets later if brand typography requires it.
 */
export function ensureReportFonts(): void {
  // no-op — Helvetica is available without registration
}
