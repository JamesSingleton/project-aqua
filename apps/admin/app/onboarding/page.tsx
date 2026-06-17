"use client";

import { organization } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

const TEAM_TYPES = [
  { value: "club", label: "Club" },
  { value: "high_school", label: "High School" },
  { value: "college", label: "College" },
  { value: "national", label: "National" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [teamType, setTeamType] = useState<string>("club");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const slug = teamName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const result = await organization.create({
      name: teamName,
      slug,
      metadata: { teamType, plan: "free" },
    });

    if (result.error) {
      setError(result.error.message ?? "Failed to create team");
      setLoading(false);
      return;
    }

    const teamId = result.data?.id;
    if (teamId) {
      await organization.setActive({ organizationId: teamId });
      router.push(`/team/${teamId}`);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your swim team</CardTitle>
          <CardDescription>
            Set up your team to start managing your roster, meets, and
            attendance.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateTeam}>
          <CardContent className="space-y-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="teamName">Team name</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="FAST Swim Club"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamType">Team type</Label>
              <Select value={teamType} onValueChange={setTeamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team type" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create team"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
