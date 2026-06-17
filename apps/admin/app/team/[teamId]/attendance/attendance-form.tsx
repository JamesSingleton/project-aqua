"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSessionAction } from "./actions";

export function AttendanceForm({
  teamId,
  rosterCount,
}: {
  teamId: string;
  rosterCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createSessionAction(teamId, {
      date: formData.get("date") as string,
      location: (formData.get("location") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New practice session</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="date">Date & time</Label>
            <Input id="date" name="date" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Pool name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional" />
          </div>
          <Button type="submit" disabled={loading || rosterCount === 0}>
            {loading ? "Creating..." : "Create session"}
          </Button>
        </form>
        {rosterCount === 0 && (
          <p className="text-muted-foreground mt-2 text-sm">
            Add swimmers to your roster before creating sessions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
