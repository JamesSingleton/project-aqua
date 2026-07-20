"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import {
  CLASS_YEAR_LABELS,
  CLASS_YEARS,
  type ClassYear,
} from "@project-aqua/swim-core/team-types";
import { Button } from "@project-aqua/ui/components/button";
import { Calendar } from "@project-aqua/ui/components/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
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
import { CalendarIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  type CreateSwimmerFormValues,
  createSwimmerFormSchema,
} from "@/schemas";
import { createSwimmerAction, lookupUsaSwimmerAction } from "./actions";

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

function parseDateOfBirth(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateOfBirth(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateOfBirthLabel(value: string) {
  const date = parseDateOfBirth(value);
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function DateOfBirthPicker({
  id,
  value,
  onChange,
  disabled,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateOfBirth(value);
  const label = formatDateOfBirthLabel(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            aria-invalid={invalid}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {label ?? "Pick a date"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate ?? new Date(2010, 0)}
          onSelect={(date) => {
            onChange(date ? formatDateOfBirth(date) : "");
            setOpen(false);
          }}
          disabled={{ after: new Date() }}
          captionLayout="dropdown"
          startMonth={new Date(1920, 0)}
          endMonth={new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}

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
  const [linkExisting, setLinkExisting] = useState(false);

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

  async function handleUsaBlur(usaId: string) {
    if (!usaId.trim()) {
      setUsaLookup(null);
      setLinkExisting(false);
      setValue("linkExistingSwimmerId", undefined);
      return;
    }

    try {
      const found = await lookupUsaSwimmerAction(teamId, usaId);
      setUsaLookup(found);
      const shouldLink = Boolean(found);
      setLinkExisting(shouldLink);

      if (found) {
        setValue("firstName", found.firstName, { shouldValidate: true });
        setValue("lastName", found.lastName, { shouldValidate: true });
        setValue("dateOfBirth", found.dateOfBirth, { shouldValidate: true });
        setValue("linkExistingSwimmerId", found.id);
      } else {
        setValue("linkExistingSwimmerId", undefined);
      }
    } catch {
      setUsaLookup(null);
      setLinkExisting(false);
      setValue("linkExistingSwimmerId", undefined);
    }
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
                Start with USA Swimming ID if you have it — we&apos;ll fill what
                we can.
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
                      : "Leave blank to create a brand-new swimmer profile."}
                  </FieldDescription>
                </Field>
                <Field data-invalid={!!errors.firstName}>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input
                    id="firstName"
                    aria-invalid={!!errors.firstName}
                    readOnly={linkExisting}
                    {...register("firstName")}
                  />
                  <FieldError errors={[errors.firstName]} />
                </Field>
                <Field data-invalid={!!errors.lastName}>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input
                    id="lastName"
                    aria-invalid={!!errors.lastName}
                    readOnly={linkExisting}
                    {...register("lastName")}
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
                    {...register("preferredName")}
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
                      <DateOfBirthPicker
                        id="dateOfBirth"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={linkExisting}
                        invalid={!!errors.dateOfBirth}
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
