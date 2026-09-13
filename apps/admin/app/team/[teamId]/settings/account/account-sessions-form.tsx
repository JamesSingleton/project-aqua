"use client";

import { revokeSession, revokeSessions } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  FieldDescription,
  FieldError,
} from "@project-aqua/ui/components/field";
import { Laptop, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOutToMarketing } from "@/lib/sign-out";

export type ActiveSession = {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
};

function sessionManageError(
  error: { message?: string; code?: string },
  fallback: string,
) {
  if (
    error.code === "SESSION_NOT_FRESH" ||
    error.message === "Session is not fresh"
  ) {
    return "Sign in again to end sessions on other devices.";
  }
  return error.message ?? fallback;
}

function parseSessionLabel(userAgent: string | null): {
  device: "mobile" | "desktop";
  label: string;
} {
  if (!userAgent) {
    return { device: "desktop", label: "Unknown device" };
  }
  const ua = userAgent.toLowerCase();
  const isMobile = /mobile|iphone|android|ipad/.test(ua);
  let browser = "Browser";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";

  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  const label = os ? `${browser} on ${os}` : browser;
  return { device: isMobile ? "mobile" : "desktop", label };
}

export function AccountSessionsForm({
  sessions: initialSessions,
  currentSessionId,
  currentSessionToken,
}: {
  sessions: ActiveSession[];
  currentSessionId: string;
  currentSessionToken: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [signingOut, setSigningOut] = useState(false);
  const [sessions, setSessions] = useState(initialSessions);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function isCurrentSession(session: ActiveSession) {
    return (
      session.id === currentSessionId || session.token === currentSessionToken
    );
  }

  function removeLocal(id: string) {
    setSessions((current) => current.filter((session) => session.id !== id));
  }

  async function signOutHere() {
    setError("");
    setMessage("");
    setSigningOut(true);
    const result = await signOutToMarketing();
    if (!result.ok) {
      setSigningOut(false);
      setError(result.error);
    }
  }

  function revokeOne(session: ActiveSession) {
    if (isCurrentSession(session)) {
      void signOutHere();
      return;
    }

    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await revokeSession({ token: session.token });
      if (result.error) {
        setError(sessionManageError(result.error, "Could not end session"));
        return;
      }
      removeLocal(session.id);
      setMessage("Session ended");
    });
  }

  function revokeAllOthers() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await revokeSessions();
      if (result.error) {
        setError(
          sessionManageError(result.error, "Could not end other sessions"),
        );
        return;
      }
      setSessions((current) =>
        current.filter((session) => isCurrentSession(session)),
      );
      setMessage("Signed out on all other devices");
      router.refresh();
    });
  }

  const otherSessions = sessions.filter(
    (session) => !isCurrentSession(session),
  );
  const busy = pending || signingOut;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-sm font-medium">Active sessions</h4>
        <p className="text-muted-foreground text-sm">
          Devices where you&apos;re signed in. End any session you don&apos;t
          recognize.
        </p>
      </div>

      <ul className="divide-y rounded-lg border">
        {sessions.map((session) => {
          const { device, label } = parseSessionLabel(session.userAgent);
          const isCurrent = isCurrentSession(session);
          return (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {device === "mobile" ? (
                  <Smartphone className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <Laptop className="text-muted-foreground size-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {label}
                    {isCurrent ? (
                      <span className="text-muted-foreground ml-2 font-normal">
                        (this device)
                      </span>
                    ) : null}
                  </p>
                  {session.ipAddress ? (
                    <FieldDescription className="truncate">
                      {session.ipAddress}
                    </FieldDescription>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isCurrent ? "outline" : "ghost"}
                className={
                  isCurrent
                    ? undefined
                    : "text-destructive hover:text-destructive"
                }
                disabled={busy}
                onClick={() => revokeOne(session)}
              >
                {isCurrent && signingOut
                  ? "Signing out…"
                  : isCurrent
                    ? "Sign out"
                    : "End"}
              </Button>
            </li>
          );
        })}
      </ul>

      {otherSessions.length > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={revokeAllOthers}
        >
          Sign out all other devices
        </Button>
      ) : null}

      {error ? <FieldError>{error}</FieldError> : null}
      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}
    </div>
  );
}
