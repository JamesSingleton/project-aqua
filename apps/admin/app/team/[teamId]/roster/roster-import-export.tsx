"use client";

import { Button } from "@project-aqua/ui/components/button";
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
import { exportRosterCsvAction } from "../roster/actions";
import { importRosterCsvAction } from "../meets/actions";

export function RosterImportExport({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage("");

    try {
      const content = await file.text();
      const result = await importRosterCsvAction(teamId, content);
      setMessage(`Imported ${result.added} swimmers`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    }
    setLoading(false);
  }

  function handleExportTemplate() {
    const blob = new Blob(
      [
        "first_name,last_name,middle_name,preferred_name,date_of_birth,gender,practice_group,usa_member_id,parent_name,parent_email\n",
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roster-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportRoster() {
    setLoading(true);
    setMessage("");
    try {
      const csv = await exportRosterCsvAction(teamId);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "roster-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Roster exported (audit logged)");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Export failed");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export roster</CardTitle>
        <CardDescription>
          CSV import deduplicates on USA Swimming ID. Export requires head coach
          role and current SafeSport training.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rosterCsv">Import CSV</Label>
          <input
            id="rosterCsv"
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={loading}
            className="block w-full text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportTemplate}>
            Download template
          </Button>
          <Button variant="outline" onClick={handleExportRoster} disabled={loading}>
            Export roster
          </Button>
        </div>
        {message && <p className="text-muted-foreground text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
}
