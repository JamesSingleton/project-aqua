"use client";

import { authClient } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Input } from "@project-aqua/ui/components/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeCalendarConnectAction,
  disconnectCalendarAction,
  ensureIcsFeedAction,
  rotateIcsFeedAction,
  syncCalendarNowAction,
} from "./actions";

type Connection = {
  id: string;
  provider: "google" | "microsoft";
  externalCalendarName: string | null;
  status: string;
  lastSyncedAt: Date | string | null;
  lastError: string | null;
};

type Conflict = {
  id: string;
  createdAt: Date | string;
  aquaEventId: string | null;
  provider: string;
  resolution: string;
};

export function CalendarSyncPanel({
  teamId,
  feedToken,
  connections,
  conflicts,
  baseUrl,
}: {
  teamId: string;
  feedToken: string | null;
  connections: Connection[];
  conflicts: Conflict[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState(feedToken);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const icsUrl = token
    ? `${baseUrl}/api/calendar/${teamId}/feed.ics?token=${token}`
    : null;

  function ensureFeed() {
    startTransition(async () => {
      const next = await ensureIcsFeedAction(teamId);
      setToken(next);
      router.refresh();
    });
  }

  function rotateFeed() {
    startTransition(async () => {
      const next = await rotateIcsFeedAction(teamId);
      setToken(next);
      router.refresh();
    });
  }

  async function connectProvider(provider: "google" | "microsoft") {
    setMessage("");
    const scopes =
      provider === "google"
        ? [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
          ]
        : ["Calendars.ReadWrite", "offline_access"];

    const result = await authClient.linkSocial({
      provider,
      scopes,
      callbackURL: `/team/${teamId}/calendar?connected=${provider}`,
    });

    if (result.error) {
      setMessage(result.error.message ?? "Failed to start OAuth");
      return;
    }

    // If linkSocial returns without redirect (already linked with scopes), finish setup
    try {
      await completeCalendarConnectAction(teamId, provider);
      router.refresh();
      setMessage(`${provider} calendar connected`);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "OAuth started — finish consent then return here",
      );
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscribe (ICS)</CardTitle>
          <CardDescription>
            Works with Google Calendar, Outlook, and Apple Calendar via “From
            URL”
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {icsUrl ? (
            <>
              <Input readOnly value={icsUrl} />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(icsUrl)}
                >
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={rotateFeed}
                  disabled={pending}
                >
                  Rotate token
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  Open Google Calendar
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Outlook: Add calendar → Subscribe from web → paste the link.
              </p>
            </>
          ) : (
            <Button onClick={ensureFeed} disabled={pending}>
              Generate ICS feed
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bidirectional sync</CardTitle>
          <CardDescription>
            Creates a dedicated “Project Aqua – Team” calendar. Aqua wins on
            conflicts for team events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void connectProvider("google")}
            >
              Connect Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void connectProvider("microsoft")}
            >
              Connect Outlook
            </Button>
            <Button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await syncCalendarNowAction(teamId);
                  router.refresh();
                })
              }
              disabled={pending || connections.length === 0}
            >
              Sync now
            </Button>
          </div>
          {message && <p className="text-sm">{message}</p>}
          {connections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No calendar connections yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {connections.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-2"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {c.provider} · {c.status}
                    </div>
                    <div className="text-muted-foreground">
                      {c.externalCalendarName ?? "Dedicated team calendar"}
                      {c.lastSyncedAt
                        ? ` · Last sync ${new Date(c.lastSyncedAt).toLocaleString()}`
                        : ""}
                    </div>
                    {c.lastError && (
                      <div className="text-destructive">{c.lastError}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await disconnectCalendarAction(teamId, c.id);
                        router.refresh();
                      })
                    }
                  >
                    Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent sync conflicts</CardTitle>
            <CardDescription>
              External edits were overwritten by the team calendar (Aqua wins)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {conflicts.map((c) => (
                <li key={c.id} className="rounded border p-2">
                  <span className="capitalize">{c.provider}</span> ·{" "}
                  {new Date(c.createdAt).toLocaleString()}
                  {c.aquaEventId ? (
                    <>
                      {" "}
                      · Event{" "}
                      <span className="font-mono text-xs">{c.aquaEventId}</span>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
