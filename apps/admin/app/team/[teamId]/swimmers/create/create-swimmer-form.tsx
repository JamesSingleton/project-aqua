"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import {
  CLASS_YEAR_LABELS,
  CLASS_YEARS,
  type ClassYear,
} from "@project-aqua/swim-core/team-types";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { Textarea } from "@project-aqua/ui/components/textarea";
import { cn } from "@project-aqua/ui/lib/utils";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DatePickerField } from "@/components/date-picker-field";
import {
  type CreateSwimmerFormValues,
  createSwimmerFormSchema,
} from "@/schemas";
import {
  createSwimmerAction,
  lookupLinkableSwimmerAction,
  lookupUsaSwimmerAction,
} from "./actions";

type IdentityMatch = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  dateOfBirth: string;
  governingBodyId: string | null;
  teamNames: string[];
};

const STEPS = [
  {
    id: "profile",
    title: "Profile",
    description: "Who is this swimmer?",
  },
  {
    id: "contacts",
    title: "Contacts",
    description: "Parents and emergency contacts",
  },
  {
    id: "medical",
    title: "Medical",
    description: "Optional team-only notes",
  },
] as const;

const GENDER_ITEMS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const CLASS_YEAR_ITEMS = CLASS_YEARS.map((year) => ({
  value: year,
  label: `${year} · ${CLASS_YEAR_LABELS[year]}`,
}));

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "middleName",
  "preferredName",
  "practiceGroup",
  "classYear",
  "usaMemberId",
] as const;

const CONTACT_FIELDS = [
  "contacts.parentName",
  "contacts.parentEmail",
  "contacts.parentPhone",
  "contacts.emergencyName",
  "contacts.emergencyPhone",
] as const;

function StepIndicator({
  currentStep,
  completedThrough,
}: {
  currentStep: number;
  completedThrough: number;
}) {
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
      {STEPS.map((step, index) => {
        const done = index <= completedThrough && index !== currentStep;
        const active = index === currentStep;
        return (
          <li
            key={step.id}
            className={cn(
              "flex flex-1 items-start gap-3 rounded-lg border p-3",
              active && "border-primary bg-primary/5",
              done && "border-muted-foreground/20",
              !active && !done && "border-border opacity-70",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                active && "bg-primary text-primary-foreground",
                done && "bg-muted text-foreground",
                !active && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-muted-foreground text-xs text-pretty">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const defaultValues: CreateSwimmerFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  gender: "male",
  practiceGroup: "",
  classYear: undefined,
  usaMemberId: "",
  contacts: {
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    emergencyName: "",
    emergencyPhone: "",
  },
  medical: {
    allergies: "",
    medications: "",
    conditions: "",
  },
};

export default function CreateSwimmerForm({
  teamId,
  showClassYear = false,
  variant = "page",
}: {
  teamId: string;
  showClassYear?: boolean;
  variant?: "page" | "modal";
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [usaLookup, setUsaLookup] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  } | null>(null);
  const [identityMatches, setIdentityMatches] = useState<IdentityMatch[]>([]);
  const [linkExisting, setLinkExisting] = useState(false);
  const declinedIdentityKeyRef = useRef<string | null>(null);

  const form = useForm<CreateSwimmerFormValues>({
    resolver: zodResolver(createSwimmerFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = form;

  const dateOfBirth = watch("dateOfBirth");
  const isMinor = dateOfBirth ? isMinorSwimmer(dateOfBirth) : false;
  const currentStep = STEPS[stepIndex]?.id ?? "profile";

  function identityLookupKey(identity: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth: string;
  }) {
    return [
      identity.firstName.trim().toLowerCase(),
      identity.lastName.trim().toLowerCase(),
      (identity.preferredName ?? "").trim().toLowerCase(),
      identity.dateOfBirth.trim().slice(0, 10),
    ].join("|");
  }

  function clearLinkState() {
    setUsaLookup(null);
    setIdentityMatches([]);
    setLinkExisting(false);
    setValue("linkExistingSwimmerId", undefined);
    setValue("forceNewPerson", undefined);
  }

  function applyLink(match: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) {
    setLinkExisting(true);
    declinedIdentityKeyRef.current = null;
    setValue("firstName", match.firstName, { shouldValidate: true });
    setValue("lastName", match.lastName, { shouldValidate: true });
    setValue("dateOfBirth", match.dateOfBirth, { shouldValidate: true });
    setValue("linkExistingSwimmerId", match.id);
    setValue("forceNewPerson", undefined);
  }

  async function handleUsaBlur(usaId: string) {
    if (!usaId.trim()) {
      clearLinkState();
      void lookupIdentityMatches();
      return;
    }

    try {
      const found = await lookupUsaSwimmerAction(teamId, usaId);
      setIdentityMatches([]);
      setUsaLookup(found);
      if (found) {
        applyLink(found);
      } else {
        setLinkExisting(false);
        setValue("linkExistingSwimmerId", undefined);
        void lookupIdentityMatches();
      }
    } catch {
      clearLinkState();
    }
  }

  async function lookupIdentityMatches() {
    const values = form.getValues();
    if (values.usaMemberId?.trim()) return;
    if (values.linkExistingSwimmerId) return;

    const identity = {
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      preferredName: values.preferredName || undefined,
      dateOfBirth: values.dateOfBirth ?? "",
    };
    if (
      !identity.firstName.trim() ||
      !identity.lastName.trim() ||
      !identity.dateOfBirth.trim()
    ) {
      setIdentityMatches([]);
      return;
    }

    const key = identityLookupKey(identity);
    if (declinedIdentityKeyRef.current === key) {
      setIdentityMatches([]);
      return;
    }

    try {
      const matches = await lookupLinkableSwimmerAction(teamId, identity);
      setIdentityMatches(matches);
      if (matches.length === 1 && matches[0]) {
        applyLink(matches[0]);
      }
    } catch {
      setIdentityMatches([]);
    }
  }

  function chooseIdentityMatch(match: IdentityMatch) {
    setIdentityMatches([match]);
    applyLink(match);
  }

  function declineIdentityLink() {
    const values = form.getValues();
    declinedIdentityKeyRef.current = identityLookupKey({
      firstName: values.firstName ?? "",
      lastName: values.lastName ?? "",
      preferredName: values.preferredName || undefined,
      dateOfBirth: values.dateOfBirth ?? "",
    });
    setIdentityMatches([]);
    setLinkExisting(false);
    setValue("linkExistingSwimmerId", undefined);
    setValue("forceNewPerson", true);
  }

  async function goNext() {
    setSubmitError("");
    const fields =
      currentStep === "profile"
        ? PROFILE_FIELDS
        : currentStep === "contacts"
          ? CONTACT_FIELDS
          : [];
    const valid = fields.length === 0 ? true : await trigger([...fields]);
    if (!valid) return;
    const next = Math.min(stepIndex + 1, STEPS.length - 1);
    setStepIndex(next);
    setFurthestStep((f) => Math.max(f, next));
  }

  function goBack() {
    setSubmitError("");
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onSubmit(values: CreateSwimmerFormValues) {
    setSubmitError("");
    try {
      await createSwimmerAction(teamId, values);
      if (variant === "modal") {
        router.back();
      } else {
        router.push(`/team/${teamId}/roster`);
      }
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to add swimmer",
      );
    }
  }

  const footer = (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4",
        variant === "page" && "sticky bottom-0 bg-background",
      )}
    >
      <div className="flex gap-2">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
        ) : variant === "page" ? (
          <Button
            type="button"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/roster`} />}
          >
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {currentStep === "medical" ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void handleSubmit(onSubmit)()}
            >
              Skip &amp; add swimmer
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Adding..."
                : linkExisting
                  ? "Link swimmer"
                  : "Add swimmer"}
            </Button>
          </>
        ) : (
          <Button type="submit">Continue</Button>
        )}
      </div>
    </div>
  );

  const formBody = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (currentStep === "medical") {
          void handleSubmit(onSubmit)(e);
        } else {
          void goNext();
        }
      }}
      className={cn(
        "flex flex-col gap-6",
        variant === "modal" && "h-full min-h-0",
      )}
    >
      <StepIndicator currentStep={stepIndex} completedThrough={furthestStep} />

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-6",
          variant === "modal" && "min-h-0 flex-1 overflow-y-auto pr-1",
        )}
      >
        {currentStep === "profile" ? (
          <FieldGroup className="gap-6">
            <FieldSet>
              <FieldLegend>Identity</FieldLegend>
              <FieldDescription>
                Prefer USA Swimming ID when you have it. Otherwise we&apos;ll
                look for the same person on your other teams by name and date of
                birth.
              </FieldDescription>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="usaMemberId">USA Swimming ID</FieldLabel>
                  <Input
                    id="usaMemberId"
                    placeholder="Optional"
                    {...register("usaMemberId", {
                      onBlur: (event) => handleUsaBlur(event.target.value),
                    })}
                  />
                  <FieldDescription>
                    {usaLookup
                      ? `Matched ${usaLookup.firstName} ${usaLookup.lastName} — this will link their existing profile to your team.`
                      : "Leave blank if you do not have it — name and DOB can still link across your teams."}
                  </FieldDescription>
                </Field>
                {!usaLookup &&
                identityMatches.length === 1 &&
                identityMatches[0] ? (
                  <div className="bg-muted sm:col-span-2 flex flex-col gap-2 rounded-lg px-3 py-2 text-sm">
                    <p>
                      Found{" "}
                      <span className="font-medium">
                        {identityMatches[0].firstName}{" "}
                        {identityMatches[0].lastName}
                      </span>{" "}
                      on {identityMatches[0].teamNames.join(", ")}. Linking
                      keeps one profile across your teams.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={declineIdentityLink}
                      >
                        Create as new person
                      </Button>
                    </div>
                  </div>
                ) : null}
                {!usaLookup && identityMatches.length > 1 ? (
                  <div className="bg-muted sm:col-span-2 flex flex-col gap-2 rounded-lg px-3 py-2 text-sm">
                    <p>
                      Several people on your other teams match this name and
                      date of birth. Pick who to link, or create a new profile.
                    </p>
                    <ul className="flex flex-col gap-2">
                      {identityMatches.map((match) => (
                        <li
                          key={match.id}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span>
                            {match.firstName} {match.lastName}
                            {match.governingBodyId
                              ? ` · USA ${match.governingBodyId}`
                              : ""}{" "}
                            · {match.teamNames.join(", ")}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => chooseIdentityMatch(match)}
                          >
                            Link this person
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-fit"
                      onClick={declineIdentityLink}
                    >
                      Create as new person
                    </Button>
                  </div>
                ) : null}
                <Field data-invalid={!!errors.firstName}>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input
                    id="firstName"
                    aria-invalid={!!errors.firstName}
                    readOnly={linkExisting}
                    {...register("firstName", {
                      onBlur: () => void lookupIdentityMatches(),
                    })}
                  />
                  <FieldError errors={[errors.firstName]} />
                </Field>
                <Field data-invalid={!!errors.lastName}>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input
                    id="lastName"
                    aria-invalid={!!errors.lastName}
                    readOnly={linkExisting}
                    {...register("lastName", {
                      onBlur: () => void lookupIdentityMatches(),
                    })}
                  />
                  <FieldError errors={[errors.lastName]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="middleName">Middle name</FieldLabel>
                  <Input
                    id="middleName"
                    placeholder="Optional"
                    {...register("middleName")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="preferredName">
                    Preferred name
                  </FieldLabel>
                  <Input
                    id="preferredName"
                    placeholder="Optional"
                    {...register("preferredName", {
                      onBlur: () => void lookupIdentityMatches(),
                    })}
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Details</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.dateOfBirth}>
                  <FieldLabel htmlFor="dateOfBirth">Date of birth</FieldLabel>
                  <Controller
                    name="dateOfBirth"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        id="dateOfBirth"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          if (linkExisting) return;
                          queueMicrotask(() => void lookupIdentityMatches());
                        }}
                        disabled={linkExisting}
                        disableFuture
                        labelMonth="long"
                        startMonth={new Date(1920, 0)}
                        aria-invalid={!!errors.dateOfBirth}
                      />
                    )}
                  />
                  <FieldError errors={[errors.dateOfBirth]} />
                </Field>
                <Field data-invalid={!!errors.gender}>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        items={GENDER_ITEMS}
                        value={field.value}
                        onValueChange={(v) => {
                          if (v != null) field.onChange(v);
                        }}
                        disabled={linkExisting}
                      >
                        <SelectTrigger
                          id="gender"
                          className="w-full"
                          aria-invalid={!!errors.gender}
                        >
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {GENDER_ITEMS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.gender]} />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="practiceGroup">
                    Training group
                  </FieldLabel>
                  <Input
                    id="practiceGroup"
                    placeholder="e.g. Varsity / Senior Gold"
                    {...register("practiceGroup")}
                  />
                </Field>
                {showClassYear ? (
                  <Field data-invalid={!!errors.classYear}>
                    <FieldLabel htmlFor="classYear">Class</FieldLabel>
                    <Controller
                      name="classYear"
                      control={control}
                      render={({ field }) => (
                        <Select
                          items={CLASS_YEAR_ITEMS}
                          value={field.value ?? ""}
                          onValueChange={(v) =>
                            field.onChange(v ? (v as ClassYear) : undefined)
                          }
                        >
                          <SelectTrigger
                            id="classYear"
                            className="w-full"
                            aria-invalid={!!errors.classYear}
                          >
                            <SelectValue placeholder="FR / SO / JR / SR" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {CLASS_YEAR_ITEMS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError errors={[errors.classYear]} />
                  </Field>
                ) : null}
              </div>
            </FieldSet>
          </FieldGroup>
        ) : null}

        {currentStep === "contacts" ? (
          <FieldGroup className="gap-6">
            {isMinor ? (
              <p className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm">
                This swimmer is under 18 — parent/guardian name and email are
                required.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Contacts are optional for adult swimmers, but recommended for
                emergencies.
              </p>
            )}

            <FieldSet>
              <FieldLegend>Parent / guardian</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.contacts?.parentName}>
                  <FieldLabel htmlFor="parentName">Name</FieldLabel>
                  <Input
                    id="parentName"
                    aria-invalid={!!errors.contacts?.parentName}
                    {...register("contacts.parentName")}
                  />
                  <FieldError errors={[errors.contacts?.parentName]} />
                </Field>
                <Field data-invalid={!!errors.contacts?.parentEmail}>
                  <FieldLabel htmlFor="parentEmail">Email</FieldLabel>
                  <Input
                    id="parentEmail"
                    type="email"
                    aria-invalid={!!errors.contacts?.parentEmail}
                    {...register("contacts.parentEmail")}
                  />
                  <FieldError errors={[errors.contacts?.parentEmail]} />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="parentPhone">Phone</FieldLabel>
                  <Input
                    id="parentPhone"
                    type="tel"
                    {...register("contacts.parentPhone")}
                  />
                </Field>
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Emergency contact</FieldLegend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="emergencyName">Name</FieldLabel>
                  <Input
                    id="emergencyName"
                    {...register("contacts.emergencyName")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="emergencyPhone">Phone</FieldLabel>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    {...register("contacts.emergencyPhone")}
                  />
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>
        ) : null}

        {currentStep === "medical" ? (
          <FieldGroup className="gap-6">
            <FieldSet>
              <FieldLegend>Medical notes</FieldLegend>
              <FieldDescription>
                Visible only to coaches on this team. You can skip this step.
              </FieldDescription>
              <div className="grid grid-cols-1 gap-4">
                <Field>
                  <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
                  <Textarea
                    id="allergies"
                    rows={3}
                    placeholder="Food, medication, environmental…"
                    {...register("medical.allergies")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="medications">Medications</FieldLabel>
                  <Textarea
                    id="medications"
                    rows={3}
                    placeholder="Inhaler, ADHD meds, etc."
                    {...register("medical.medications")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="conditions">
                    Conditions / other notes
                  </FieldLabel>
                  <Textarea
                    id="conditions"
                    rows={3}
                    placeholder="Asthma, injuries, coach-facing notes…"
                    {...register("medical.conditions")}
                  />
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>
        ) : null}
      </div>

      {footer}
    </form>
  );

  if (variant === "modal") {
    return formBody;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href={`/team/${teamId}/roster`}
          className="text-muted-foreground hover:text-foreground w-fit text-sm"
        >
          ← Back to roster
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add swimmer</h1>
        <p className="text-muted-foreground text-pretty">
          Add someone to this team&apos;s roster. Contacts and medical info stay
          on this team only.
        </p>
      </div>
      {formBody}
    </div>
  );
}
