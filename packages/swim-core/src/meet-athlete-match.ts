import { normalizePersonName } from "./people";

/** Minimal roster row needed for results matching. */
export type MatchRosterAthlete = {
  membershipId: string;
  swimmerId: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  governingBodyId?: string | null;
};

/** Minimal file athlete identity from a results row. */
export type MatchFileAthlete = {
  swimmerName: string;
  usaMemberId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  teamCode?: string;
};

export type MatchCandidate = {
  membershipId: string;
  swimmerId: string;
  displayName: string;
  reason: "usa_id" | "name_dob" | "name" | "last_dob" | "name_similar";
};

export type FileAthleteMatch = {
  /** Stable key for this file athlete (maps / UI). */
  key: string;
  swimmerName: string;
  usaMemberId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  teamCode?: string;
  resultCount: number;
  status: "matched" | "ambiguous" | "unmatched";
  /** Set when status === "matched". */
  matched?: MatchCandidate;
  /** Soft / competing candidates for review. */
  candidates: MatchCandidate[];
};

export type MatchResultAthletesResult = {
  matched: FileAthleteMatch[];
  ambiguous: FileAthleteMatch[];
  unmatched: FileAthleteMatch[];
  /** All unique file athletes in encounter order. */
  athletes: FileAthleteMatch[];
};

function rosterDisplayName(r: MatchRosterAthlete): string {
  const first = r.preferredName?.trim() || r.firstName;
  return `${first} ${r.lastName}`.trim();
}

function rosterNames(r: MatchRosterAthlete): string[] {
  const full = normalizePersonName(`${r.firstName} ${r.lastName}`);
  const preferred = r.preferredName
    ? normalizePersonName(`${r.preferredName} ${r.lastName}`)
    : "";
  return preferred ? [full, preferred] : [full];
}

function splitDisplayName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: parts[0]! };
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1]!,
  };
}

/** Dice coefficient on bigrams — cheap similarity for soft name matches. */
function nameSimilarity(a: string, b: string): number {
  const left = normalizePersonName(a).replace(/\s/g, "");
  const right = normalizePersonName(b).replace(/\s/g, "");
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return left === right ? 1 : 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < left.length - 1; i++) {
    const bg = left.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < right.length - 1; i++) {
    const bg = right.slice(i, i + 2);
    const count = bigrams.get(bg) ?? 0;
    if (count > 0) {
      hits++;
      bigrams.set(bg, count - 1);
    }
  }
  return (2 * hits) / (left.length - 1 + (right.length - 1));
}

export function fileAthleteKey(athlete: MatchFileAthlete): string {
  if (athlete.usaMemberId?.trim()) {
    return `usa:${athlete.usaMemberId.trim().toUpperCase()}`;
  }
  const name = normalizePersonName(athlete.swimmerName);
  const dob = athlete.dateOfBirth?.slice(0, 10) ?? "";
  return `name:${name}|dob:${dob}`;
}

function toCandidate(
  r: MatchRosterAthlete,
  reason: MatchCandidate["reason"],
): MatchCandidate {
  return {
    membershipId: r.membershipId,
    swimmerId: r.swimmerId,
    displayName: rosterDisplayName(r),
    reason,
  };
}

function uniqueByMembership(candidates: MatchCandidate[]): MatchCandidate[] {
  const seen = new Set<string>();
  const out: MatchCandidate[] = [];
  for (const c of candidates) {
    if (seen.has(c.membershipId)) continue;
    seen.add(c.membershipId);
    out.push(c);
  }
  return out;
}

/**
 * Match unique athletes from a results file against the team roster.
 * Priority: USA ID → name+DOB → unique exact name → soft candidates (ambiguous).
 */
export function matchResultAthletes(
  roster: MatchRosterAthlete[],
  results: MatchFileAthlete[],
): MatchResultAthletesResult {
  const byUsa = new Map<string, MatchRosterAthlete>();
  for (const r of roster) {
    const id = r.governingBodyId?.trim().toUpperCase();
    if (id && !byUsa.has(id)) byUsa.set(id, r);
  }

  const grouped = new Map<string, MatchFileAthlete & { resultCount: number }>();
  for (const result of results) {
    const key = fileAthleteKey(result);
    const existing = grouped.get(key);
    if (existing) {
      existing.resultCount += 1;
      existing.usaMemberId ??= result.usaMemberId;
      existing.dateOfBirth ??= result.dateOfBirth;
      existing.gender ??= result.gender;
      existing.teamCode ??= result.teamCode;
      continue;
    }
    grouped.set(key, { ...result, resultCount: 1 });
  }

  const athletes: FileAthleteMatch[] = [];

  for (const [key, fileAthlete] of grouped) {
    const usa = fileAthlete.usaMemberId?.trim().toUpperCase();
    if (usa) {
      const hit = byUsa.get(usa);
      if (hit) {
        athletes.push({
          key,
          swimmerName: fileAthlete.swimmerName,
          usaMemberId: fileAthlete.usaMemberId,
          dateOfBirth: fileAthlete.dateOfBirth,
          gender: fileAthlete.gender,
          teamCode: fileAthlete.teamCode,
          resultCount: fileAthlete.resultCount,
          status: "matched",
          matched: toCandidate(hit, "usa_id"),
          candidates: [toCandidate(hit, "usa_id")],
        });
        continue;
      }
    }

    const targetName = normalizePersonName(fileAthlete.swimmerName);
    const fileDob = fileAthlete.dateOfBirth?.slice(0, 10);
    const { last: fileLast } = splitDisplayName(fileAthlete.swimmerName);
    const fileLastNorm = normalizePersonName(fileLast);

    const exactName: MatchRosterAthlete[] = [];
    const nameDob: MatchRosterAthlete[] = [];
    const lastDob: MatchRosterAthlete[] = [];
    const similar: MatchCandidate[] = [];

    for (const r of roster) {
      const names = rosterNames(r);
      const dob = r.dateOfBirth?.slice(0, 10) ?? null;
      const exact = names.includes(targetName);

      if (exact && fileDob && dob === fileDob) {
        nameDob.push(r);
      }
      if (exact) exactName.push(r);

      const rosterLast = normalizePersonName(r.lastName);
      if (
        fileDob &&
        dob === fileDob &&
        fileLastNorm &&
        rosterLast === fileLastNorm
      ) {
        lastDob.push(r);
      }

      const display = rosterDisplayName(r);
      const score = Math.max(
        nameSimilarity(fileAthlete.swimmerName, display),
        ...names.map((n) => nameSimilarity(targetName, n)),
      );
      if (score >= 0.72 && !exact) {
        similar.push(toCandidate(r, "name_similar"));
      }
    }

    if (nameDob.length === 1) {
      const hit = nameDob[0]!;
      athletes.push({
        key,
        swimmerName: fileAthlete.swimmerName,
        usaMemberId: fileAthlete.usaMemberId,
        dateOfBirth: fileAthlete.dateOfBirth,
        gender: fileAthlete.gender,
        teamCode: fileAthlete.teamCode,
        resultCount: fileAthlete.resultCount,
        status: "matched",
        matched: toCandidate(hit, "name_dob"),
        candidates: [toCandidate(hit, "name_dob")],
      });
      continue;
    }

    if (nameDob.length > 1) {
      const cands = uniqueByMembership(
        nameDob.map((r) => toCandidate(r, "name_dob")),
      );
      athletes.push({
        key,
        swimmerName: fileAthlete.swimmerName,
        usaMemberId: fileAthlete.usaMemberId,
        dateOfBirth: fileAthlete.dateOfBirth,
        gender: fileAthlete.gender,
        teamCode: fileAthlete.teamCode,
        resultCount: fileAthlete.resultCount,
        status: "ambiguous",
        candidates: cands,
      });
      continue;
    }

    if (exactName.length === 1) {
      const hit = exactName[0]!;
      athletes.push({
        key,
        swimmerName: fileAthlete.swimmerName,
        usaMemberId: fileAthlete.usaMemberId,
        dateOfBirth: fileAthlete.dateOfBirth,
        gender: fileAthlete.gender,
        teamCode: fileAthlete.teamCode,
        resultCount: fileAthlete.resultCount,
        status: "matched",
        matched: toCandidate(hit, "name"),
        candidates: [toCandidate(hit, "name")],
      });
      continue;
    }

    if (exactName.length > 1) {
      athletes.push({
        key,
        swimmerName: fileAthlete.swimmerName,
        usaMemberId: fileAthlete.usaMemberId,
        dateOfBirth: fileAthlete.dateOfBirth,
        gender: fileAthlete.gender,
        teamCode: fileAthlete.teamCode,
        resultCount: fileAthlete.resultCount,
        status: "ambiguous",
        candidates: uniqueByMembership(
          exactName.map((r) => toCandidate(r, "name")),
        ),
      });
      continue;
    }

    const soft = uniqueByMembership([
      ...lastDob.map((r) => toCandidate(r, "last_dob")),
      ...similar,
    ]);

    if (soft.length === 1 && soft[0]!.reason === "last_dob") {
      // Single last+DOB is strong enough to surface as ambiguous (manual confirm),
      // not auto-matched — spelling of first name may differ.
      athletes.push({
        key,
        swimmerName: fileAthlete.swimmerName,
        usaMemberId: fileAthlete.usaMemberId,
        dateOfBirth: fileAthlete.dateOfBirth,
        gender: fileAthlete.gender,
        teamCode: fileAthlete.teamCode,
        resultCount: fileAthlete.resultCount,
        status: "ambiguous",
        candidates: soft,
      });
      continue;
    }

    if (soft.length > 0) {
      athletes.push({
        key,
        swimmerName: fileAthlete.swimmerName,
        usaMemberId: fileAthlete.usaMemberId,
        dateOfBirth: fileAthlete.dateOfBirth,
        gender: fileAthlete.gender,
        teamCode: fileAthlete.teamCode,
        resultCount: fileAthlete.resultCount,
        status: "ambiguous",
        candidates: soft.slice(0, 8),
      });
      continue;
    }

    athletes.push({
      key,
      swimmerName: fileAthlete.swimmerName,
      usaMemberId: fileAthlete.usaMemberId,
      dateOfBirth: fileAthlete.dateOfBirth,
      gender: fileAthlete.gender,
      teamCode: fileAthlete.teamCode,
      resultCount: fileAthlete.resultCount,
      status: "unmatched",
      candidates: [],
    });
  }

  return {
    matched: athletes.filter((a) => a.status === "matched"),
    ambiguous: athletes.filter((a) => a.status === "ambiguous"),
    unmatched: athletes.filter((a) => a.status === "unmatched"),
    athletes,
  };
}
