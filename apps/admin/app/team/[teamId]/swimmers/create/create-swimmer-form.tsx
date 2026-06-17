"use client";

import { isMinorSwimmer } from "@project-aqua/swim-core/age";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSwimmerAction, lookupUsaSwimmerAction } from "../../roster/actions";

export default function CreateSwimmerForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dob, setDob] = useState("");
  const [usaLookup, setUsaLookup] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  } | null>(null);
  const [linkExisting, setLinkExisting] = useState(false);

  const isMinor = dob ? isMinorSwimmer(dob) : false;

  async function handleUsaBlur(usaId: string) {
    if (!usaId.trim()) {
      setUsaLookup(null);
      setLinkExisting(false);
      return;
    }
    try {
      const found = await lookupUsaSwimmerAction(teamId, usaId);
      setUsaLookup(found);
      setLinkExisting(Boolean(found));
    } catch {
      setUsaLookup(null);
      setLinkExisting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      if (linkExisting && usaLookup) {
        formData.set("linkExistingSwimmerId", usaLookup.id);
      }
      await createSwimmerAction(teamId, formData);
      router.push(`/team/${teamId}/roster`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add swimmer");
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Add swimmer</CardTitle>
        <CardDescription>
          Add a swimmer to this team. Contacts and medical info stay on this
          team only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="space-y-4">
            <h3 className="font-medium">Identity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  defaultValue={linkExisting ? usaLookup?.firstName : undefined}
                  readOnly={linkExisting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle name</Label>
                <Input id="middleName" name="middleName" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  defaultValue={linkExisting ? usaLookup?.lastName : undefined}
                  readOnly={linkExisting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred name</Label>
                <Input id="preferredName" name="preferredName" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  readOnly={linkExisting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  name="gender"
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                  required
                  disabled={linkExisting}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usaMemberId">USA Swimming ID</Label>
              <Input
                id="usaMemberId"
                name="usaMemberId"
                onBlur={(e) => handleUsaBlur(e.target.value)}
              />
              {usaLookup && (
                <p className="text-muted-foreground text-sm">
                  Found existing swimmer: {usaLookup.firstName}{" "}
                  {usaLookup.lastName}.{" "}
                  {linkExisting
                    ? "Will link to existing profile."
                    : "Creating new profile."}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="practiceGroup">Practice group</Label>
              <Input id="practiceGroup" name="practiceGroup" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">
              Guardian / contacts
              {isMinor && (
                <span className="text-destructive ml-2 text-sm font-normal">
                  Required for minors
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent/guardian name</Label>
                <Input
                  id="parentName"
                  name="parentName"
                  required={isMinor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent/guardian email</Label>
                <Input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  required={isMinor}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent/guardian phone</Label>
                <Input id="parentPhone" name="parentPhone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Emergency contact</Label>
                <Input id="emergencyName" name="emergencyName" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency phone</Label>
              <Input id="emergencyPhone" name="emergencyPhone" type="tel" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Medical (optional)</h3>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input id="allergies" name="allergies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Medications</Label>
              <Input id="medications" name="medications" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions</Label>
              <Input id="conditions" name="conditions" />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : linkExisting ? "Link swimmer" : "Add swimmer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
