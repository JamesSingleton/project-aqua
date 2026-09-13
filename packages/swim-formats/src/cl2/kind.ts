export type Cl2FileKind =
  | "meet_results"
  | "meet_entries"
  | "swimmers_only"
  | "unknown";

export function detectCl2FileKind(content: string): Cl2FileKind {
  const a0 = content.split(/\r?\n/).find((l) => l.startsWith("A0"));
  if (!a0) return "unknown";
  const label = a0.substring(11, 43).toLowerCase();
  if (label.includes("result")) return "meet_results";
  if (label.includes("entries") || label.includes("entry"))
    return "meet_entries";
  if (label.includes("swimmer") || label.includes("roster")) {
    return "swimmers_only";
  }
  return "unknown";
}
