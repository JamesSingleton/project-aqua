import type { MeetEntriesView } from "@project-aqua/db/schema";
import { saveMeetEntriesViewAction } from "./actions";

const storageKey = (teamId: string) => `pa:meetEntriesView:${teamId}`;

function isEntriesView(value: string | null): value is MeetEntriesView {
  return value === "swimmer" || value === "event";
}

export function readUnconfirmedMeetEntriesView(
  teamId: string,
): MeetEntriesView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(teamId));
    return isEntriesView(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeUnconfirmedMeetEntriesView(
  teamId: string,
  view: MeetEntriesView,
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(teamId), view);
  } catch {
    // Private mode / quota — export confirm is a no-op without this.
  }
}

export async function confirmMeetEntriesViewOnExport(teamId: string) {
  const view = readUnconfirmedMeetEntriesView(teamId);
  if (!view) return;
  await saveMeetEntriesViewAction(teamId, view);
}
