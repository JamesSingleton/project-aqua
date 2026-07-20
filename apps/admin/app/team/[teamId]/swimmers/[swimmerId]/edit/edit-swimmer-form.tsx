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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Field,
  FieldDescription,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  type CreateSwimmerFormValues,
  createSwimmerFormSchema,
} from "@/schemas";
import { editSwimmerAction } from "./actions";

const UNASSIGNED_GROUP = "__none__";

const GENDER_ITEMS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

const CLASS_YEAR_ITEMS = CLASS_YEARS.map((year) => ({
  value: year,
  label: `${year} · ${CLASS_YEAR_LABELS[year]}`,
}));

export function EditSwimmerForm({
  teamId,
  swimmerId,
  showClassYear = false,
  groups,
  groupId,
  defaultValues,
}: {
  teamId: string;
  swimmerId: string;
  showClassYear?: boolean;
  groups: { id: string; name: string }[];
  groupId: string | null;
  defaultValues: CreateSwimmerFormValues;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(
    groupId ?? UNASSIGNED_GROUP,
  );
  const form = useForm<CreateSwimmerFormValues>({
    resolver: zodResolver(createSwimmerFormSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const dateOfBirth = watch("dateOfBirth");
  const isMinor = dateOfBirth ? isMinorSwimmer(dateOfBirth) : false;
  const groupsHref = `/team/${teamId}/roster?tab=groups`;

  async function onSubmit(values: CreateSwimmerFormValues) {
    setSubmitError("");
    try {
      await editSwimmerAction(
        teamId,
        swimmerId,
        values,
        selectedGroupId === UNASSIGNED_GROUP ? null : selectedGroupId,
      );
      router.push(`/team/${teamId}/swimmers/${swimmerId}`);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update swimmer",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError ? (
        <p className="text-destructive text-sm">{submitError}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Basic swimmer information</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firstName">First name</FieldLabel>
                <Input id="firstName" {...register("firstName")} />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                <Input id="lastName" {...register("lastName")} />
                <FieldError>{errors.lastName?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="middleName">Middle name</FieldLabel>
                <Input id="middleName" {...register("middleName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="preferredName">Preferred name</FieldLabel>
                <Input id="preferredName" {...register("preferredName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dateOfBirth">Date of birth</FieldLabel>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
                <FieldError>{errors.dateOfBirth?.message}</FieldError>
              </Field>
              <Field data-invalid={!!errors.gender}>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select
                      items={GENDER_ITEMS}
                      value={field.value}
                      onValueChange={(v) => {
                        if (v != null) field.onChange(v);
                      }}
                    >
                      <SelectTrigger
                        id="gender"
                        className="w-full"
                        aria-invalid={!!errors.gender}
                      >
                        <SelectValue placeholder="Select" />
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
              <Field>
                <FieldLabel htmlFor="practiceGroup">Training group</FieldLabel>
                {groups.length === 0 ? (
                  <FieldDescription>
                    No training groups yet.{" "}
                    <Link
                      href={groupsHref}
                      className="text-foreground underline underline-offset-4"
                    >
                      Create one on the roster
                    </Link>{" "}
                    before assigning this swimmer.
                  </FieldDescription>
                ) : (
                  <>
                    <Select
                      items={[
                        { value: UNASSIGNED_GROUP, label: "Unassigned" },
                        ...groups.map((group) => ({
                          value: group.id,
                          label: group.name,
                        })),
                      ]}
                      value={selectedGroupId}
                      onValueChange={(value) => {
                        if (value != null) setSelectedGroupId(value);
                      }}
                    >
                      <SelectTrigger id="practiceGroup" className="w-full">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={UNASSIGNED_GROUP}>
                            Unassigned
                          </SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Manage groups on the{" "}
                      <Link
                        href={groupsHref}
                        className="text-foreground underline underline-offset-4"
                      >
                        roster Groups tab
                      </Link>
                      .
                    </FieldDescription>
                  </>
                )}
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
              <Field>
                <FieldLabel htmlFor="usaMemberId">USA Swimming ID</FieldLabel>
                <Input id="usaMemberId" {...register("usaMemberId")} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            {isMinor
              ? "Parent/guardian required for minors"
              : "Optional contact information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="parentName">Parent name</FieldLabel>
                <Input id="parentName" {...register("contacts.parentName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="parentEmail">Parent email</FieldLabel>
                <Input
                  id="parentEmail"
                  type="email"
                  {...register("contacts.parentEmail")}
                />
                <FieldError>{errors.contacts?.parentEmail?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="parentPhone">Parent phone</FieldLabel>
                <Input id="parentPhone" {...register("contacts.parentPhone")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="emergencyName">
                  Emergency contact
                </FieldLabel>
                <Input
                  id="emergencyName"
                  {...register("contacts.emergencyName")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="emergencyPhone">
                  Emergency phone
                </FieldLabel>
                <Input
                  id="emergencyPhone"
                  {...register("contacts.emergencyPhone")}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
                <Input id="allergies" {...register("medical.allergies")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="medications">Medications</FieldLabel>
                <Input id="medications" {...register("medical.medications")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="conditions">Conditions</FieldLabel>
                <Input id="conditions" {...register("medical.conditions")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Input id="notes" {...register("medical.notes")} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/team/${teamId}/swimmers/${swimmerId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
