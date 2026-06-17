"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Input } from "@project-aqua/ui/components/input";
import { Label } from "@project-aqua/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  submitSafesportReportAction,
  updateStaffCredentialAction,
} from "./actions";

type CredentialRow = {
  id: string;
  memberId: string;
  userId: string;
  role: string;
  credentialType: string;
  status: string;
  completedAt: Date | null;
  expiresAt: Date | null;
};

export function SafeSportSettingsClient({
  teamId,
  summary,
  credentials,
}: {
  teamId: string;
  summary: {
    seasonYear: string;
    coachesNeedingTraining: number;
    minorAckTotal: number;
    minorAckCompleted: number;
    openReports: number;
  };
  credentials: CredentialRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportCategory, setReportCategory] = useState("maapp_violation");

  async function markCredentialCurrent(memberId: string) {
    setError("");
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await updateStaffCredentialAction(teamId, {
        memberId,
        credentialType: "safesport_core",
        status: "current",
        completedAt: new Date().toISOString(),
        expiresAt: expires.toISOString(),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await submitSafesportReportAction(teamId, {
        subjectDescription: reportDescription,
        category: reportCategory as
          | "emotional_misconduct"
          | "physical_misconduct"
          | "sexual_misconduct"
          | "maapp_violation"
          | "other",
      });
      setReportDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
    }
  }

  const ackPct =
    summary.minorAckTotal > 0
      ? Math.round((summary.minorAckCompleted / summary.minorAckTotal) * 100)
      : 100;

  const coachRows = [...new Map(credentials.map((c) => [c.memberId, c])).values()];

  return (
    <div className="space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Coach training</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {summary.coachesNeedingTraining}
            </p>
            <p className="text-muted-foreground text-sm">need current SafeSport</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MAAPP acks ({summary.seasonYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ackPct}%</p>
            <p className="text-muted-foreground text-sm">
              {summary.minorAckCompleted} of {summary.minorAckTotal} minors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.openReports}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MAAPP policy</CardTitle>
          <CardDescription>2025 Minor Athlete Abuse Prevention Policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <a
              href="https://maapp.uscenterforsafesport.org/"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              View MAAPP manual
            </a>
          </p>
          <p>
            Helpline:{" "}
            <a href="tel:8662000796" className="text-primary underline">
              866-200-0796
            </a>{" "}
            ·{" "}
            <a
              href="https://safesporthelpline.org"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              safesporthelpline.org
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coach credentials</CardTitle>
          <CardDescription>
            Mark SafeSport training current after completion at{" "}
            <a
              href="https://safesporttrained.org"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              safesporttrained.org
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {coachRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No staff on file.</p>
          ) : (
            coachRows.map((c) => (
              <div
                key={c.memberId}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium capitalize">{c.role.replace("_", " ")}</p>
                  <p className="text-muted-foreground text-sm">
                    {c.status === "current" && c.expiresAt
                      ? `Expires ${new Date(c.expiresAt).toLocaleDateString()}`
                      : "Not current"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markCredentialCurrent(c.memberId)}
                >
                  Mark current
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report a concern</CardTitle>
          <CardDescription>
            Internal team record. Also report to the{" "}
            <a
              href="https://uscenterforsafesport.org/report-a-concern"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              U.S. Center for SafeSport
            </a>{" "}
            when appropriate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitReport} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={reportCategory}
                onValueChange={setReportCategory}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maapp_violation">MAAPP violation</SelectItem>
                  <SelectItem value="emotional_misconduct">
                    Emotional misconduct
                  </SelectItem>
                  <SelectItem value="physical_misconduct">
                    Physical misconduct
                  </SelectItem>
                  <SelectItem value="sexual_misconduct">
                    Sexual misconduct
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit">Submit report</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
