"use client";

import { Button } from "@project-aqua/ui/components/button";
import { Label } from "@project-aqua/ui/components/label";
import { Switch } from "@project-aqua/ui/components/switch";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateNotificationPreferencesAction } from "./actions";

type Prefs = {
  meetReminders: boolean;
  inviteEmails: boolean;
  safesportReminders: boolean;
  billingEmails: boolean;
  productUpdates: boolean;
};

const ROWS: Array<{
  key: keyof Prefs;
  label: string;
  description: string;
}> = [
  {
    key: "meetReminders",
    label: "Meet reminders",
    description: "Upcoming meet and entry deadlines for your teams.",
  },
  {
    key: "inviteEmails",
    label: "Invite activity",
    description: "When coaches accept, join, or leave your teams.",
  },
  {
    key: "safesportReminders",
    label: "SafeSport reminders",
    description: "Training expirations and compliance follow-ups.",
  },
  {
    key: "billingEmails",
    label: "Billing emails",
    description: "Invoices, plan changes, and payment notices.",
  },
  {
    key: "productUpdates",
    label: "Product updates",
    description: "Occasional tips and new feature announcements.",
  },
];

export function AccountNotificationsForm({
  teamId,
  initial,
}: {
  teamId: string;
  initial: Prefs;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const dirty = ROWS.some((row) => prefs[row.key] !== initial[row.key]);

  function save() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(teamId, prefs);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Preferences saved");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="divide-border divide-y">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="space-y-1">
              <Label htmlFor={row.key} className="text-sm font-medium">
                {row.label}
              </Label>
              <p className="text-muted-foreground text-sm">{row.description}</p>
            </div>
            <Switch
              id={row.key}
              checked={prefs[row.key]}
              disabled={pending}
              onCheckedChange={(checked) => {
                setPrefs((prev) => ({ ...prev, [row.key]: checked }));
                setMessage("");
                setError("");
              }}
            />
          </div>
        ))}
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : "Save preferences"}
        </Button>
        {message ? (
          <p className="text-muted-foreground text-xs">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
