/** Parse swim time string (e.g. "1:23.45", "23.45", "59.12") to milliseconds */
export function parseTime(time: string): number {
  const trimmed = time.trim();
  if (!trimmed) return 0;

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    const secondsPart = parts.pop() ?? "0";
    const seconds = Number.parseFloat(secondsPart);
    let totalMs = Math.round(seconds * 1000);

    if (parts.length > 0) {
      const minutes = Number.parseInt(parts.pop() ?? "0", 10);
      totalMs += minutes * 60 * 1000;
    }
    if (parts.length > 0) {
      const hours = Number.parseInt(parts.pop() ?? "0", 10);
      totalMs += hours * 3600 * 1000;
    }
    return totalMs;
  }

  return Math.round(Number.parseFloat(trimmed) * 1000);
}

/** Format milliseconds to swim time string */
export function formatTime(ms: number): string {
  if (ms <= 0) return "NT";

  const totalSeconds = ms / 1000;
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;
    return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
  }

  return totalSeconds.toFixed(2);
}

export function isFasterTime(a: number, b: number): boolean {
  if (a <= 0) return false;
  if (b <= 0) return true;
  return a < b;
}
