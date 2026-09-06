"use client";

import type { AssociationEventCaps } from "@project-aqua/swim-core/association-event-caps";
import { Button } from "@project-aqua/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@project-aqua/ui/components/tabs";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { writeUnconfirmedMeetEntriesView } from "../meet-entries-view";
import { LineupSuggestPanel } from "./lineup-suggest-panel";
import { ProgramEntriesBoard } from "./program-entries-board";
import { RegistrationBoard } from "./registration-board";
import { RelaySuggestPanel } from "./relay-suggest-panel";

type EntriesView = "swimmer" | "event";

export function EntriesWorkspace({
  teamId,
  meetId,
  initialView,
  caps,
  meetLimitsLine,
  canSuggestLineup,
  registration,
  program,
  relayPanel,
}: {
  teamId: string;
  meetId: string;
  initialView: EntriesView;
  caps: AssociationEventCaps;
  meetLimitsLine: string | null;
  canSuggestLineup: boolean;
  registration: ComponentProps<typeof RegistrationBoard>;
  program: Omit<ComponentProps<typeof ProgramEntriesBoard>, "caps">;
  relayPanel: ComponentProps<typeof RelaySuggestPanel> | null;
}) {
  const [view, setView] = useState<EntriesView>(initialView);

  useEffect(() => {
    writeUnconfirmedMeetEntriesView(teamId, initialView);
  }, [teamId, initialView]);

  function onViewChange(next: string | null) {
    if (next !== "swimmer" && next !== "event") return;
    setView(next);
    writeUnconfirmedMeetEntriesView(teamId, next);
  }

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {meetLimitsLine ? (
            <p className="text-muted-foreground text-sm">
              Meet allows {meetLimitsLine}.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {relayPanel ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              render={<a href="#relay-lineup" />}
            >
              Relay lineup
            </Button>
          ) : null}
          <Tabs value={view} onValueChange={onViewChange}>
            <TabsList>
              <TabsTrigger value="swimmer">By swimmer</TabsTrigger>
              <TabsTrigger value="event">By event</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "swimmer" ? (
        <RegistrationBoard {...registration} associationCaps={caps} />
      ) : (
        <ProgramEntriesBoard {...program} caps={caps} />
      )}

      {relayPanel ? (
        <section id="relay-lineup" className="scroll-mt-8 flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-medium">Relay lineup</h2>
            <p className="text-muted-foreground text-sm">
              Leg order, seeds, and alternates. Who is on A/B can also be set in
              By event.
            </p>
          </div>
          <RelaySuggestPanel {...relayPanel} />
        </section>
      ) : null}

      <LineupSuggestPanel
        teamId={teamId}
        meetId={meetId}
        available={canSuggestLineup}
      />
    </div>
  );
}
