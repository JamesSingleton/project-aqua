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
import { Textarea } from "@project-aqua/ui/components/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DraftQuotaHint,
  isDraftQuotaBlocked,
  type SharedDraftQuota,
} from "@/components/draft-quota-hint";
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

type DistanceUnit = "yards" | "meters";

export function WorkoutEditor({
  teamId,
  workoutId,
  initialTitle = "",
  initialRawText = "",
  initialPracticeGroup = "",
  initialDistanceUnit = "yards",
  practiceSessionId,
  draftQuota: initialDraftQuota,
}: {
  teamId: string;
  workoutId?: string;
  initialTitle?: string;
  initialRawText?: string;
  initialPracticeGroup?: string;
  initialDistanceUnit?: DistanceUnit | null;
  practiceSessionId?: string;
  draftQuota: SharedDraftQuota;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draftQuota, setDraftQuota] = useState(initialDraftQuota);
  const suggestBlocked = isDraftQuotaBlocked(draftQuota);
  const [title, setTitle] = useState(initialTitle);
  const [rawText, setRawText] = useState(initialRawText);
  const [practiceGroup, setPracticeGroup] = useState(initialPracticeGroup);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(
    initialDistanceUnit ?? "yards",
  );
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
        if (!title) setTitle(focus.trim().slice(0, 40));
        if (result.draftQuota) {
          setDraftQuota(result.draftQuota);
        }
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
          distanceUnit,
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
            Write coach notation, then parse into sets.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="group">Practice group</Label>
              <Input
                id="group"
                value={practiceGroup}
                onChange={(e) => setPracticeGroup(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distance-unit">Distance unit</Label>
              <Select
                items={[
                  { value: "yards", label: "Yards" },
                  { value: "meters", label: "Meters" },
                ]}
                value={distanceUnit}
                onValueChange={(value) => {
                  if (value === "yards" || value === "meters") {
                    setDistanceUnit(value);
                  }
                }}
              >
                <SelectTrigger id="distance-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yards">Yards</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <details className="rounded-lg border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">
              Need a starting draft?
            </summary>
            <div className="mt-3 space-y-3">
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
                disabled={pending || suggestBlocked}
                onClick={handleSuggest}
              >
                {pending ? "Working…" : "Suggest a practice"}
              </Button>
              <DraftQuotaHint surface="workout" quota={draftQuota} />
            </div>
          </details>

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
            Total distance: {totalDistance || "—"} {distanceUnit} ·{" "}
            {sets.length} sets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Parse the workout text to preview sets.
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
