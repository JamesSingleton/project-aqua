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
import { Textarea } from "@project-aqua/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  parseWorkoutPreviewAction,
  saveWorkoutAction,
  suggestWorkoutAction,
} from "./actions";

type ParsedSet = {
  sortOrder: number;
  section: string | null;
  reps: number;
  distance: number;
  stroke: string;
  intensity: string;
  interval: string | null;
  rawLine: string;
};

export function WorkoutEditor({
  teamId,
  workoutId,
  initialTitle = "",
  initialRawText = "",
  initialPracticeGroup = "",
  practiceSessionId,
}: {
  teamId: string;
  workoutId?: string;
  initialTitle?: string;
  initialRawText?: string;
  initialPracticeGroup?: string;
  practiceSessionId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle);
  const [rawText, setRawText] = useState(initialRawText);
  const [practiceGroup, setPracticeGroup] = useState(initialPracticeGroup);
  const [focus, setFocus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("90");
  const [sets, setSets] = useState<ParsedSet[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [aiDraftText, setAiDraftText] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [wasAiGenerated, setWasAiGenerated] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    const parsed = await parseWorkoutPreviewAction(rawText);
    setSets(parsed.sets);
    setTotalDistance(parsed.totalDistance);
    setWarnings(parsed.warnings);
  }

  function handleSuggest() {
    if (!focus.trim()) {
      setError("Describe the practice focus before suggesting.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const result = await suggestWorkoutAction(teamId, {
          focus: focus.trim(),
          durationMinutes: Number(durationMinutes) || undefined,
          practiceGroup: practiceGroup || undefined,
        });
        setRawText(result.draftText);
        setAiDraftText(result.draftText);
        setAiPrompt(result.prompt);
        setWasAiGenerated(true);
        if (!title) setTitle(`AI · ${focus.trim().slice(0, 40)}`);
        const parsed = await parseWorkoutPreviewAction(result.draftText);
        setSets(parsed.sets);
        setTotalDistance(parsed.totalDistance);
        setWarnings(parsed.warnings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Suggest failed");
      }
    });
  }

  function handleSave() {
    setError("");
    startTransition(async () => {
      try {
        const result = await saveWorkoutAction(teamId, {
          workoutId,
          title,
          rawText,
          practiceGroup: practiceGroup || undefined,
          wasAiGenerated,
          aiPrompt,
          aiDraftText,
          practiceSessionId,
        });
        router.push(`/team/${teamId}/workouts/${result.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{workoutId ? "Edit workout" : "New workout"}</CardTitle>
          <CardDescription>
            Write coach notation or ask AI to suggest, then parse into sets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tuesday AM · Age Group"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group">Practice group</Label>
            <Input
              id="group"
              value={practiceGroup}
              onChange={(e) => setPracticeGroup(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">AI suggest</p>
            <div className="space-y-2">
              <Label htmlFor="focus">Focus</Label>
              <Input
                id="focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Aerobic free + fly speed, taper week"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={handleSuggest}
            >
              {pending ? "Working…" : "Suggest workout"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="raw">Workout text</Label>
            <Textarea
              id="raw"
              className="min-h-64 font-mono text-sm"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Warm-up\n4x100 free @ 1:30 easy\nMain\n8x50 fly @ :50 race\nCool-down\n200 choice`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void handleParse()}
            >
              Parse
            </Button>
            <Button
              type="button"
              disabled={pending || !rawText.trim()}
              onClick={handleSave}
            >
              {pending ? "Saving…" : "Save workout"}
            </Button>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parsed sets</CardTitle>
          <CardDescription>
            Total distance: {totalDistance || "—"} · {sets.length} sets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Parse or suggest a workout to preview structured sets.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sets.map((set) => (
                <li
                  key={`${set.sortOrder}-${set.rawLine}`}
                  className="rounded border px-3 py-2"
                >
                  <div className="font-medium">
                    {set.reps}×{set.distance} {set.stroke}
                    {set.interval ? ` @ ${set.interval}` : ""}
                    {set.intensity !== "unknown" ? ` · ${set.intensity}` : ""}
                  </div>
                  {set.section && (
                    <div className="text-muted-foreground text-xs capitalize">
                      {set.section}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <div className="text-muted-foreground space-y-1 text-xs">
              {warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
