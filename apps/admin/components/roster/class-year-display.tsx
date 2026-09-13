import {
  CLASS_YEAR_LABELS,
  type ClassYear,
} from "@project-aqua/swim-core/team-types";

/** Abbreviation on mobile; full label from tablet up. */
export function ClassYearDisplay({
  value,
}: {
  value: string | null | undefined;
}) {
  if (!value) return null;
  const label = CLASS_YEAR_LABELS[value as ClassYear];
  if (!label) return <>{value}</>;

  return (
    <span title={`${value} · ${label}`}>
      <span className="md:hidden">{value}</span>
      <span className="hidden md:inline">{label}</span>
    </span>
  );
}
