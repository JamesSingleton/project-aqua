"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { twoFactor } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import { Checkbox } from "@project-aqua/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";

const twoFactorSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("totp"),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit authentication code."),
    trustDevice: z.boolean(),
  }),
  z.object({
    mode: z.literal("backup"),
    code: z.string().trim().min(1, "Enter a backup code."),
    trustDevice: z.boolean(),
  }),
]);

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

export default function TwoFactorPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    resetField,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      mode: "totp",
      code: "",
      trustDevice: true,
    },
  });
  const mode = watch("mode");
  const code = watch("code");

  async function onSubmit(values: TwoFactorFormValues) {
    setError("");

    const result =
      values.mode === "totp"
        ? await twoFactor.verifyTotp({
            code: values.code,
            trustDevice: values.trustDevice,
          })
        : await twoFactor.verifyBackupCode({
            code: values.code,
            trustDevice: values.trustDevice,
          });

    if (result.error) {
      setError(result.error.message ?? "Verification failed");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  function changeMode(nextMode: TwoFactorFormValues["mode"]) {
    setValue("mode", nextMode);
    resetField("code", { defaultValue: "" });
    setError("");
  }

  return (
    <AuthShell>
      <form
        className="flex flex-col gap-6"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Two-factor authentication</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {mode === "totp"
                ? "Enter the 6-digit code from your authenticator app."
                : "Enter one of your single-use backup codes."}
            </p>
          </div>
          {error ? <FieldError>{error}</FieldError> : null}
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="code">
              {mode === "totp" ? "Authentication code" : "Backup code"}
            </FieldLabel>
            <Input
              id="code"
              inputMode={mode === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              aria-invalid={!!errors.code}
              autoFocus
              {...register("code")}
            />
            <FieldError errors={[errors.code]} />
          </Field>
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="trustDevice"
              render={({ field }) => (
                <Checkbox
                  id="trust-device"
                  checked={field.value}
                  name={field.name}
                  onBlur={field.onBlur}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  ref={field.ref}
                />
              )}
            />
            <FieldLabel htmlFor="trust-device" className="font-normal">
              Trust this device for 30 days
            </FieldLabel>
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting || !code}>
              {isSubmitting ? "Verifying…" : "Verify"}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            {mode === "totp" ? (
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => changeMode("backup")}
              >
                Use a backup code
              </button>
            ) : (
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => changeMode("totp")}
              >
                Use authenticator app
              </button>
            )}
            {" · "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Back to sign in
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
