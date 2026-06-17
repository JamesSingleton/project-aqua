"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Label } from "@project-aqua/ui/components/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { importMeetFileAction } from "../actions";

export default function MeetImportClient({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const content = await file.text();
      const format = file.name.endsWith(".hy3") ? "hy3" : "sdif";
      const result = await importMeetFileAction(teamId, content, format);
      router.push(`/team/${teamId}/meets/${result.meetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Import meet</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Upload meet file</CardTitle>
          <CardDescription>
            Supports SDIF/SD3 and HY-TEK .HY3 files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="meetFile">Meet file</Label>
            <input
              id="meetFile"
              type="file"
              accept=".sd3,.sdif,.hy3,.txt"
              onChange={handleFile}
              disabled={loading}
              className="block w-full text-sm"
            />
          </div>
          {loading && (
            <p className="text-muted-foreground text-sm">Importing...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
