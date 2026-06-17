"use client";

import { Badge } from "@project-aqua/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@project-aqua/ui/components/tabs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSwimmerPiiAction } from "../../roster/actions";

type Affiliation = {
  organizationId: string;
  name: string;
  teamType: string;
  status: string;
  practiceGroup: string | null;
};

type PiiData = {
  contacts: {
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    emergencyName: string | null;
    emergencyPhone: string | null;
  } | null;
  medical: {
    allergies: string | null;
    medications: string | null;
    conditions: string | null;
    notes: string | null;
  } | null;
};

export function SwimmerProfileTabs({
  teamId,
  swimmerId,
  membershipId,
  isMinor,
  affiliations,
  clubRegistration,
}: {
  teamId: string;
  swimmerId: string;
  membershipId: string;
  isMinor: boolean;
  affiliations: Affiliation[];
  clubRegistration: {
    usaMemberId: string;
    clubId: string | null;
    registrationStatus: string | null;
  } | null;
}) {
  const [pii, setPii] = useState<PiiData | null>(null);
  const [piiError, setPiiError] = useState("");

  useEffect(() => {
    if (!isMinor) {
      fetchSwimmerPiiAction(teamId, membershipId)
        .then(setPii)
        .catch((err) =>
          setPiiError(err instanceof Error ? err.message : "Access denied"),
        );
      return;
    }

    fetchSwimmerPiiAction(teamId, membershipId)
      .then(setPii)
      .catch((err) =>
        setPiiError(err instanceof Error ? err.message : "Access denied"),
      );
  }, [teamId, membershipId, isMinor]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Team affiliations</CardTitle>
          <CardDescription>Teams this swimmer is rostered on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {affiliations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No affiliations.</p>
          ) : (
            affiliations.map((a) => (
              <div
                key={a.organizationId}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  {a.organizationId === teamId ? (
                    <span className="font-medium">{a.name}</span>
                  ) : (
                    <Link
                      href={`/team/${a.organizationId}/swimmers/${swimmerId}`}
                      className="text-primary font-medium underline"
                    >
                      {a.name}
                    </Link>
                  )}
                  <p className="text-muted-foreground text-sm capitalize">
                    {a.teamType.replace("_", " ")} · {a.status}
                  </p>
                </div>
                {a.organizationId === teamId && (
                  <Badge variant="secondary">This team</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This team</CardTitle>
          <CardDescription>Club registration on this affiliation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {clubRegistration ? (
            <>
              <p>
                <span className="text-muted-foreground">USA ID:</span>{" "}
                {clubRegistration.usaMemberId}
              </p>
              {clubRegistration.clubId && (
                <p>
                  <span className="text-muted-foreground">Club:</span>{" "}
                  {clubRegistration.clubId}
                </p>
              )}
              {clubRegistration.registrationStatus && (
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {clubRegistration.registrationStatus}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No club registration on file.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Contacts & medical</CardTitle>
          <CardDescription>
            Team-scoped data — only visible to coaches on this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {piiError ? (
            <p className="text-destructive text-sm">{piiError}</p>
          ) : !pii ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <Tabs defaultValue="contacts">
              <TabsList>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
              </TabsList>
              <TabsContent value="contacts" className="space-y-2 pt-4 text-sm">
                {pii.contacts ? (
                  <>
                    <p>
                      <span className="text-muted-foreground">Parent:</span>{" "}
                      {pii.contacts.parentName ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {pii.contacts.parentEmail ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {pii.contacts.parentPhone ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Emergency:</span>{" "}
                      {pii.contacts.emergencyName ?? "—"}{" "}
                      {pii.contacts.emergencyPhone
                        ? `(${pii.contacts.emergencyPhone})`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No contacts on file.</p>
                )}
              </TabsContent>
              <TabsContent value="medical" className="space-y-2 pt-4 text-sm">
                {pii.medical ? (
                  <>
                    <p>
                      <span className="text-muted-foreground">Allergies:</span>{" "}
                      {pii.medical.allergies ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Medications:</span>{" "}
                      {pii.medical.medications ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Conditions:</span>{" "}
                      {pii.medical.conditions ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Notes:</span>{" "}
                      {pii.medical.notes ?? "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No medical info on file.</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
