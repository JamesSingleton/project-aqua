"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatTime } from "@project-aqua/swim-core/times";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import { DownloadIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  createTimeStandardSetAction,
  deleteTimeStandardCutAction,
  deleteTimeStandardSetAction,
  saveTimeStandardCutAction,
  updateTimeStandardCutAction,
  updateTimeStandardSetAction,
  uploadTimeStandardCutsAction,
} from "../../time-standards-actions";

type StandardSet = {
  id: string;
  name: string;
  course: string;
  seasonLabel: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  cutCount: number;
};

type StandardCut = {
  id: string;
  eventKey: string;
  eventLabel: string | null;
  gender: "male" | "female" | "mixed";
  ageGroup: string;
  timeMs: number;
};

type StandardEvent = {
  eventKey: string;
  label: string;
  course: string;
  gender: "male" | "female" | "mixed";
  distance: number;
  stroke: string;
};

const createSetSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  course: z.enum(["SCY", "SCM", "LCM"]),
  seasonLabel: z.string(),
});

type CreateSetValues = z.infer<typeof createSetSchema>;

const manualCutSchema = z.object({
  setId: z.string().min(1, "Select a standards set"),
  gender: z.enum(["male", "female", "mixed"]),
  eventKey: z.string().min(1, "Select an event"),
  ageGroup: z.string().trim().min(1, "Age group is required"),
  time: z
    .string()
    .trim()
    .regex(/^(?:\d+:)?\d{1,2}\.\d{1,2}$/, "Use a time like 58.11 or 1:02.50"),
});

type ManualCutValues = z.infer<typeof manualCutSchema>;

const CSV_TEMPLATE = `eventKey,gender,ageGroup,time
100_free_scy_f,female,Open,1:00.32
100_free_scy_m,male,Open,58.11
200_medley_relay_scy_x,mixed,Open,1:55.00
`;

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "mixed", label: "Mixed" },
] as const;

const GENDER_LABELS: Record<StandardCut["gender"], string> = {
  female: "Female",
  male: "Male",
  mixed: "Mixed",
};

const COURSE_LABELS = {
  SCY: "SCY",
  SCM: "SCM",
  LCM: "LCM",
} as const;

export function TimeStandardsManager({
  teamId,
  selectedSetId,
  sets,
  cuts,
  events,
}: {
  teamId: string;
  selectedSetId: string | null;
  sets: StandardSet[];
  cuts: StandardCut[];
  events: StandardEvent[];
}) {
  const router = useRouter();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadPending, startUploadTransition] = useTransition();
  const [actionPending, startActionTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadSetId, setUploadSetId] = useState(
    selectedSetId ?? sets[0]?.id ?? "",
  );
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editSetName, setEditSetName] = useState("");
  const [editSetSeason, setEditSetSeason] = useState("");
  const [editingCutId, setEditingCutId] = useState<string | null>(null);
  const [editCutTime, setEditCutTime] = useState("");

  const selectedSet = sets.find((set) => set.id === selectedSetId) ?? null;
  const initialGender = "female" as const;
  const initialEventKey =
    events.find(
      (event) =>
        event.course === selectedSet?.course && event.gender === initialGender,
    )?.eventKey ?? "";

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSetValues>({
    resolver: zodResolver(createSetSchema),
    defaultValues: {
      name: "",
      course: "SCY",
      seasonLabel: "",
    },
  });

  const manualForm = useForm<ManualCutValues>({
    resolver: zodResolver(manualCutSchema),
    defaultValues: {
      setId: selectedSetId ?? sets[0]?.id ?? "",
      gender: initialGender,
      eventKey: initialEventKey,
      ageGroup: "Open",
      time: "",
    },
  });

  const pending =
    isSubmitting ||
    manualForm.formState.isSubmitting ||
    uploadPending ||
    actionPending;

  const standardSetOptions = sets.map((set) => ({
    value: set.id,
    label: `${set.name} · ${set.course}`,
  }));
  const selectedManualSetId = manualForm.watch("setId");
  const selectedGender = manualForm.watch("gender");
  const selectedCourse = sets.find(
    (set) => set.id === selectedManualSetId,
  )?.course;
  const eventOptions = events
    .filter(
      (event) =>
        event.course === selectedCourse && event.gender === selectedGender,
    )
    .map((event) => ({ value: event.eventKey, label: event.label }));

  const standardsPath = `/team/${teamId}/meets/time-standards`;

  function selectSet(setId: string) {
    if (selectedSetId === setId) {
      router.push(standardsPath);
      return;
    }
    router.push(`${standardsPath}?set=${setId}`);
  }

  function firstEventKey(setId: string, gender: StandardEvent["gender"]) {
    const course = sets.find((set) => set.id === setId)?.course;
    return (
      events.find((event) => event.course === course && event.gender === gender)
        ?.eventKey ?? ""
    );
  }

  function clearFlash() {
    setError(null);
    setMessage(null);
  }

  async function onCreateSet(values: CreateSetValues) {
    clearFlash();
    try {
      const id = await createTimeStandardSetAction(teamId, {
        name: values.name,
        course: values.course,
        seasonLabel: values.seasonLabel || undefined,
      });
      reset({
        name: "",
        course: values.course,
        seasonLabel: "",
      });
      setUploadSetId(id);
      manualForm.setValue("setId", id);
      manualForm.setValue(
        "eventKey",
        events.find(
          (event) =>
            event.course === values.course &&
            event.gender === manualForm.getValues("gender"),
        )?.eventKey ?? "",
      );
      setMessage("Set created");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create set");
    }
  }

  async function onSaveCut(values: ManualCutValues) {
    clearFlash();
    try {
      const result = await saveTimeStandardCutAction(teamId, values);
      manualForm.reset({ ...values, time: "" });
      setMessage(`Saved ${result.eventKey}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save cut");
    }
  }

  function startEditSet(set: StandardSet) {
    setEditingSetId(set.id);
    setEditSetName(set.name);
    setEditSetSeason(set.seasonLabel ?? "");
  }

  function saveEditSet(setId: string) {
    clearFlash();
    startActionTransition(async () => {
      try {
        await updateTimeStandardSetAction(teamId, setId, {
          name: editSetName,
          seasonLabel: editSetSeason,
        });
        setEditingSetId(null);
        setMessage("Set updated");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update set");
      }
    });
  }

  function removeSet(set: StandardSet) {
    if (
      !window.confirm(
        `Delete “${set.name}” and all ${set.cutCount} cut${set.cutCount === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }
    clearFlash();
    startActionTransition(async () => {
      try {
        await deleteTimeStandardSetAction(teamId, set.id);
        setMessage("Set deleted");
        if (selectedSetId === set.id) {
          const next = sets.find((candidate) => candidate.id !== set.id);
          router.push(next ? `${standardsPath}?set=${next.id}` : standardsPath);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete set");
      }
    });
  }

  function startEditCut(cut: StandardCut) {
    setEditingCutId(cut.id);
    setEditCutTime(formatTime(cut.timeMs));
  }

  function saveEditCut(cutId: string) {
    clearFlash();
    startActionTransition(async () => {
      try {
        await updateTimeStandardCutAction(teamId, cutId, editCutTime);
        setEditingCutId(null);
        setMessage("Cut updated");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update cut");
      }
    });
  }

  function removeCut(cut: StandardCut) {
    if (
      !window.confirm(
        `Delete the ${cut.eventLabel ?? cut.eventKey} cut for ${cut.ageGroup}?`,
      )
    ) {
      return;
    }
    clearFlash();
    startActionTransition(async () => {
      try {
        await deleteTimeStandardCutAction(teamId, cut.id);
        setMessage("Cut deleted");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete cut");
      }
    });
  }

  function downloadCsvTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "time-standards-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create time standard set</CardTitle>
          <CardDescription>
            Group cut times by course and season (e.g. AG zones, JO cuts).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onCreateSet)}>
            <FieldGroup className="flex-row flex-wrap items-end gap-4">
              <Field data-invalid={!!errors.name} className="w-full sm:w-80">
                <FieldLabel htmlFor={`${inputId}-name`}>Name</FieldLabel>
                <Input
                  id={`${inputId}-name`}
                  placeholder="2026 AG Zones"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Controller
                name="course"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-28">
                    <FieldLabel htmlFor={`${inputId}-course`}>
                      Course
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value != null) field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id={`${inputId}-course`}
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue>
                          {COURSE_LABELS[field.value] ?? field.value}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="SCY">SCY</SelectItem>
                          <SelectItem value="SCM">SCM</SelectItem>
                          <SelectItem value="LCM">LCM</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Field
                data-invalid={!!errors.seasonLabel}
                className="w-full sm:w-40"
              >
                <FieldLabel htmlFor={`${inputId}-season`}>
                  Season label
                </FieldLabel>
                <Input
                  id={`${inputId}-season`}
                  placeholder="2025-26"
                  aria-invalid={!!errors.seasonLabel}
                  {...register("seasonLabel")}
                />
                <FieldError errors={[errors.seasonLabel]} />
              </Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Create set"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Add cuts</CardTitle>
              <CardDescription>
                Enter one qualifying time, or replace a whole set from CSV.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={downloadCsvTemplate}>
              <DownloadIcon data-icon="inline-start" />
              Download CSV template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {sets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Create a standards set first, then add qualifying times.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">One at a time</p>
                <form onSubmit={manualForm.handleSubmit(onSaveCut)}>
                  <FieldGroup className="flex-row flex-wrap items-end gap-4">
                    <Controller
                      name="setId"
                      control={manualForm.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="w-full sm:w-64"
                        >
                          <FieldLabel htmlFor={`${inputId}-cut-set`}>
                            Standards set
                          </FieldLabel>
                          <Select
                            items={standardSetOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              if (value == null) return;
                              field.onChange(value);
                              manualForm.setValue(
                                "eventKey",
                                firstEventKey(
                                  value,
                                  manualForm.getValues("gender"),
                                ),
                                { shouldValidate: true },
                              );
                            }}
                          >
                            <SelectTrigger
                              id={`${inputId}-cut-set`}
                              className="w-full"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select set">
                                {standardSetOptions.find(
                                  (option) => option.value === field.value,
                                )?.label ?? null}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {sets.map((set) => (
                                  <SelectItem key={set.id} value={set.id}>
                                    {set.name} · {set.course}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Controller
                      name="gender"
                      control={manualForm.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="w-full sm:w-32"
                        >
                          <FieldLabel htmlFor={`${inputId}-cut-gender`}>
                            Gender
                          </FieldLabel>
                          <Select
                            items={[...GENDER_OPTIONS]}
                            value={field.value}
                            onValueChange={(value) => {
                              if (value == null) return;
                              field.onChange(value);
                              manualForm.setValue(
                                "eventKey",
                                firstEventKey(
                                  manualForm.getValues("setId"),
                                  value,
                                ),
                                { shouldValidate: true },
                              );
                            }}
                          >
                            <SelectTrigger
                              id={`${inputId}-cut-gender`}
                              className="w-full"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue>
                                {GENDER_LABELS[field.value] ?? field.value}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {GENDER_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Controller
                      name="eventKey"
                      control={manualForm.control}
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="w-full sm:w-72"
                        >
                          <FieldLabel htmlFor={`${inputId}-cut-event`}>
                            Event
                          </FieldLabel>
                          <Select
                            items={eventOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              if (value != null) field.onChange(value);
                            }}
                            disabled={eventOptions.length === 0}
                          >
                            <SelectTrigger
                              id={`${inputId}-cut-event`}
                              className="w-full"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select event">
                                {eventOptions.find(
                                  (option) => option.value === field.value,
                                )?.label ?? null}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {eventOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Field
                      data-invalid={!!manualForm.formState.errors.ageGroup}
                      className="w-full sm:w-32"
                    >
                      <FieldLabel htmlFor={`${inputId}-cut-age`}>
                        Age group
                      </FieldLabel>
                      <Input
                        id={`${inputId}-cut-age`}
                        placeholder="Open"
                        aria-invalid={!!manualForm.formState.errors.ageGroup}
                        {...manualForm.register("ageGroup")}
                      />
                      <FieldError
                        errors={[manualForm.formState.errors.ageGroup]}
                      />
                    </Field>
                    <Field
                      data-invalid={!!manualForm.formState.errors.time}
                      className="w-full sm:w-32"
                    >
                      <FieldLabel htmlFor={`${inputId}-cut-time`}>
                        Qualifying time
                      </FieldLabel>
                      <Input
                        id={`${inputId}-cut-time`}
                        className="font-timing"
                        placeholder="1:02.50"
                        aria-invalid={!!manualForm.formState.errors.time}
                        {...manualForm.register("time")}
                      />
                      <FieldError errors={[manualForm.formState.errors.time]} />
                    </Field>
                    <Button
                      type="submit"
                      disabled={manualForm.formState.isSubmitting}
                    >
                      {manualForm.formState.isSubmitting
                        ? "Saving…"
                        : "Save cut"}
                    </Button>
                  </FieldGroup>
                </form>
              </div>

              <div className="flex items-center gap-4" aria-hidden="true">
                <div className="bg-border h-px flex-1" />
                <span className="font-timing text-muted-foreground text-[0.7rem] tracking-[0.4em] uppercase">
                  or
                </span>
                <div className="bg-border h-px flex-1" />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Upload a CSV</p>
                  <p className="text-muted-foreground text-sm">
                    Columns: eventKey, gender, ageGroup, time. Replaces every
                    cut in the selected set.
                  </p>
                </div>
                <FieldGroup className="flex-row flex-wrap items-end gap-4">
                  <Field className="w-56">
                    <FieldLabel htmlFor={`${inputId}-upload-set`}>
                      Set
                    </FieldLabel>
                    <Select
                      items={standardSetOptions}
                      value={uploadSetId}
                      onValueChange={(v) => {
                        if (v != null) setUploadSetId(v);
                      }}
                    >
                      <SelectTrigger
                        id={`${inputId}-upload-set`}
                        className="w-full"
                        aria-invalid={false}
                      >
                        <SelectValue placeholder="Select set">
                          {standardSetOptions.find(
                            (option) => option.value === uploadSetId,
                          )?.label ?? null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {sets.map((set) => (
                            <SelectItem key={set.id} value={set.id}>
                              {set.name} · {set.course}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="w-auto">
                    <FieldLabel
                      htmlFor={`${inputId}-cuts-file`}
                      className="sr-only"
                    >
                      Cuts CSV file
                    </FieldLabel>
                    <Input
                      id={`${inputId}-cuts-file`}
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file || !uploadSetId) return;
                        clearFlash();
                        startUploadTransition(async () => {
                          try {
                            const text = await file.text();
                            const result = await uploadTimeStandardCutsAction(
                              teamId,
                              uploadSetId,
                              text,
                            );
                            setMessage(`Uploaded ${result.count} cuts`);
                            router.refresh();
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Failed to upload cuts",
                            );
                          }
                        });
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending || !uploadSetId}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploadPending ? "Uploading…" : "Choose CSV"}
                    </Button>
                  </Field>
                </FieldGroup>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standards sets</CardTitle>
          <CardDescription>
            {sets.length} {sets.length === 1 ? "set" : "sets"}. Open a set only
            when you need to review or edit its cuts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sets yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Cuts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sets.map((set) => {
                  const isSelected = set.id === selectedSetId;
                  const isEditing = editingSetId === set.id;
                  return (
                    <TableRow
                      key={set.id}
                      data-state={isSelected ? "selected" : undefined}
                      className="data-[state=selected]:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editSetName}
                            onChange={(e) => setEditSetName(e.target.value)}
                            disabled={pending}
                            aria-label="Set name"
                          />
                        ) : (
                          set.name
                        )}
                      </TableCell>
                      <TableCell>{set.course}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editSetSeason}
                            onChange={(e) => setEditSetSeason(e.target.value)}
                            placeholder="Season"
                            disabled={pending}
                            aria-label="Season label"
                          />
                        ) : (
                          (set.seasonLabel ?? "—")
                        )}
                      </TableCell>
                      <TableCell>{set.cutCount}</TableCell>
                      <TableCell>
                        {new Date(set.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(set.updatedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                disabled={pending || !editSetName.trim()}
                                onClick={() => saveEditSet(set.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() => setEditingSetId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant={isSelected ? "secondary" : "outline"}
                                disabled={pending}
                                onClick={() => selectSet(set.id)}
                              >
                                {isSelected ? "Hide cuts" : "View cuts"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() => startEditSet(set)}
                              >
                                <PencilIcon data-icon="inline-start" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                onClick={() => removeSet(set)}
                              >
                                <Trash2Icon data-icon="inline-start" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedSet ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Cuts · {selectedSet.name} ({selectedSet.course})
            </CardTitle>
            <CardDescription>
              {cuts.length} qualifying {cuts.length === 1 ? "time" : "times"} in
              this set. Edit times inline or delete cuts you no longer need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cuts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No cuts yet. Use Add cuts above to enter times or upload a CSV.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Age group</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuts.map((cut) => {
                    const isEditing = editingCutId === cut.id;
                    return (
                      <TableRow key={cut.id}>
                        <TableCell className="font-medium">
                          {cut.eventLabel ?? cut.eventKey}
                        </TableCell>
                        <TableCell>{GENDER_LABELS[cut.gender]}</TableCell>
                        <TableCell>{cut.ageGroup}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              className="font-timing max-w-32"
                              value={editCutTime}
                              onChange={(e) => setEditCutTime(e.target.value)}
                              disabled={pending}
                              aria-label="Qualifying time"
                            />
                          ) : (
                            <span className="font-timing">
                              {formatTime(cut.timeMs)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={pending || !editCutTime.trim()}
                                  onClick={() => saveEditCut(cut.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pending}
                                  onClick={() => setEditingCutId(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pending}
                                  onClick={() => startEditCut(cut)}
                                >
                                  <PencilIcon data-icon="inline-start" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pending}
                                  onClick={() => removeCut(cut)}
                                >
                                  <Trash2Icon data-icon="inline-start" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {message ? <p className="text-sm">{message}</p> : null}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
