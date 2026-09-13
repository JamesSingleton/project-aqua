"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@project-aqua/ui/components/card";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  getRegistrationLinkAction,
  syncSwimsRosterAction,
} from "@/app/team/[teamId]/settings/usa-swimming/actions";

export function SwimsConnectionWidget({
  teamId,
  teamName,
  clubId,
  usasMembers,
  notInCommit,
  inactiveInCommit,
  nonAthletes,
  lastSyncedAt,
}: {
  teamId: string;
  teamName: string;
  clubId: string | null;
  usasMembers: number;
  notInCommit: number;
  inactiveInCommit: number;
  nonAthletes: number;
  lastSyncedAt: string | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const connected = Boolean(clubId);

  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    getRegistrationLinkAction(teamId)
      .then((link) => {
        if (!cancelled) setRegistrationUrl(link);
      })
      .catch(() => {
        if (!cancelled) setRegistrationUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [connected, teamId]);

  function handleCopy() {
    if (!registrationUrl) return;
    void navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleRefresh() {
    if (!connected) return;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await syncSwimsRosterAction(teamId);
        setMessage(
          `Sync complete: ${result.added} added, ${result.updated} updated`,
        );
        const link = await getRegistrationLinkAction(teamId).catch(() => "");
        if (link) setRegistrationUrl(link);
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Sync failed");
      }
    });
  }

  return (
    <Card className="gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-0.5">
              <Image
                src="/usa-swimming-logo.svg"
                alt="USA Swimming"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="truncate text-base font-semibold">
              SWIMS 3.0 connection
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={!connected || isPending}
            onClick={handleRefresh}
          >
            <RefreshCwIcon
              className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-5 pt-(--card-spacing)">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className={
                connected
                  ? "size-2 shrink-0 rounded-full bg-emerald-500"
                  : "bg-muted-foreground/40 size-2 shrink-0 rounded-full"
              }
              aria-label={connected ? "Connected" : "Not connected"}
            />
            <span className="text-muted-foreground truncate text-sm">
              {teamName}
            </span>
          </div>
          <p className="text-xl font-bold">
            {connected && clubId ? `${clubId} — Connected` : "Not connected"}
          </p>
          {lastSyncedAt ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Last synced{" "}
              {new Date(lastSyncedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>

        {connected ? (
          <div>
            <p className="mb-1 text-sm font-medium">
              USA Swimming registration link
            </p>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground flex-1 truncate font-mono text-xs">
                {registrationUrl ||
                  (isPending
                    ? "Refreshing…"
                    : "Generate a link with Refresh, or open settings.")}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!registrationUrl}
                className="border-border bg-background hover:bg-muted flex shrink-0 items-center justify-center rounded-md border p-1.5 transition-colors disabled:opacity-50"
                aria-label="Copy registration link"
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="text-muted-foreground size-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Connect your club in settings to sync roster registration from SWIMS
            3.0.
          </p>
        )}

        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}

        <Separator />

        <div className="mb-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-1.5 text-xs">
              # USAS members
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <UsersIcon className="text-muted-foreground size-4" />
              <span className="font-timing text-2xl font-bold tabular-nums">
                {usasMembers}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-1.5 text-xs">
              Not in Commit
            </p>
            <span
              className={`font-timing text-2xl font-bold tabular-nums ${
                notInCommit > 0 ? "text-destructive" : ""
              }`}
            >
              {notInCommit}
            </span>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-1.5 text-xs">
              Inactive in Commit
            </p>
            <span
              className={`font-timing text-2xl font-bold tabular-nums ${
                inactiveInCommit === 0 ? "text-emerald-600" : ""
              }`}
            >
              {inactiveInCommit}
            </span>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-1.5 text-xs">Non-athletes</p>
            <span className="font-timing text-2xl font-bold tabular-nums">
              {nonAthletes}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-1.5 text-sm"
            size="sm"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/roster`} />}
          >
            <UsersIcon className="size-3.5" />
            Manage roster
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1.5 text-sm"
            size="sm"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/settings/usa-swimming`} />}
          >
            <ExternalLinkIcon className="size-3.5" />
            {connected ? "Manage registrations" : "Connect SWIMS"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
