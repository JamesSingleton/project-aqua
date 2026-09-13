/** Trim optional text; empty → null. Throws if over maxLength. */
export function normalizeOptionalText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new Error(`Must be ${maxLength} characters or fewer`);
  }
  return trimmed;
}

/** Same as normalizeOptionalText but returns undefined instead of null. */
export function normalizeOptionalTextUndefined(
  value: string | null | undefined,
  maxLength: number,
): string | undefined {
  const result = normalizeOptionalText(value, maxLength);
  return result ?? undefined;
}
