"use client";

import { Button } from "@project-aqua/ui/components/button";
import { useEffect, useState } from "react";
import {
  connectUsaSwimmingClubAction,
  getRegistrationLinkAction,
  getVendorClubsAction,
  syncSwimsRosterAction,
} from "./actions";

export function UsaSwimmingSettings({
  teamId,
  connectedClubId,
}: {
  teamId: string;
  connectedClubId?: string;
}) {
  const [clubs, setClubs] = useState<
    { clubId: string; clubName: string; clubCode: string }[]
  >([]);
  const [selectedClub, setSelectedClub] = useState(connectedClubId ?? "");
  const [regLink, setRegLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getVendorClubsAction(teamId)
      .then(setClubs)
      .catch(() => setClubs([]));
  }, [teamId]);

  async function handleConnect() {
    if (!selectedClub) return;
    setLoading(true);
    await connectUsaSwimmingClubAction(teamId, selectedClub);
    setMessage("Club connected successfully");
    setLoading(false);
  }

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const result = await syncSwimsRosterAction(teamId);
      setMessage(
        `Sync complete: ${result.added} added, ${result.updated} updated`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed");
    }
    setLoading(false);
  }

  async function handleRegLink() {
    setLoading(true);
    try {
      const link = await getRegistrationLinkAction(teamId);
      setRegLink(link);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to get link");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {clubs.length > 0 ? (
        <div className="space-y-2">
          <label htmlFor="club" className="text-sm font-medium">
            Select club
          </label>
          <select
            id="club"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
          >
            <option value="">Select a club...</option>
            {clubs.map((club) => (
              <option key={club.clubId} value={club.clubId}>
                {club.clubName} ({club.clubCode})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No vendor clubs available. Complete USA Swimming vendor onboarding and
          have clubs activate your vendor in hub.usaswimming.org.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleConnect} disabled={loading || !selectedClub}>
          Connect club
        </Button>
        {connectedClubId && (
          <>
            <Button variant="outline" onClick={handleSync} disabled={loading}>
              Sync roster
            </Button>
            <Button
              variant="outline"
              onClick={handleRegLink}
              disabled={loading}
            >
              Get registration link
            </Button>
          </>
        )}
      </div>

      {regLink && (
        <p className="text-sm">
          Registration link:{" "}
          <a
            href={regLink}
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            {regLink}
          </a>
        </p>
      )}
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  );
}
