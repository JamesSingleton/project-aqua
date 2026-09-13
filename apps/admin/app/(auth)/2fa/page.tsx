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

const totpSchema = z.object({
  mode: z.literal("totp"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit authentication code."),
  trustDevice: z.boolean(),
});

const backupSchema = z.object({
  mode: z.literal("backup"),
  code: z.string().trim().min(1, "Enter a backup code."),
  trustDevice: z.boolean(),
});

const emailOtpSchema = z.object({
  mode: z.literal("email"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
  trustDevice: z.boolean(),
});

const twoFactorSchema = z.discriminatedUnion("mode", [
  totpSchema,
  backupSchema,
  emailOtpSchema,
]);

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

export default function TwoFactorPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
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

  async function sendEmailOtp() {
    setError("");
    setSendingOtp(true);
    const result = await twoFactor.sendOtp();
    setSendingOtp(false);
    if (result.error) {
      setError(result.error.message ?? "Could not send email code");
      return;
    }
    setEmailOtpSent(true);
  }

  async function onSubmit(values: TwoFactorFormValues) {
    setError("");

    const result =
      values.mode === "totp"
        ? await twoFactor.verifyTotp({
            code: values.code,
            trustDevice: values.trustDevice,
          })
        : values.mode === "backup"
          ? await twoFactor.verifyBackupCode({
              code: values.code,
              trustDevice: values.trustDevice,
            })
          : await twoFactor.verifyOtp({
              code: values.code,
              trustDevice: values.trustDevice,
            });

    if (result.error) {
      setError(result.error.message ?? "Verification failed");
      return;
    }

    router.push("/");
    router.refresh();
  }

  function changeMode(nextMode: TwoFactorFormValues["mode"]) {
    setValue("mode", nextMode);
    resetField("code", { defaultValue: "" });
    setError("");
    if (nextMode !== "email") {
      setEmailOtpSent(false);
    }
  }

  const heading =
    mode === "totp"
      ? "Enter the 6-digit code from your authenticator app."
      : mode === "backup"
        ? "Enter one of your single-use backup codes."
        : emailOtpSent
          ? "Enter the 6-digit code we emailed you."
          : "We can email you a one-time sign-in code.";

  return (
    <AuthShell>
      <form
        className="flex flex-col gap-6"
        method="post"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(onSubmit)(event);
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Two-factor authentication</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {heading}
            </p>
          </div>
          {error ? <FieldError>{error}</FieldError> : null}

          {mode === "email" && !emailOtpSent ? (
            <Field>
              <Button
                type="button"
                disabled={sendingOtp}
                onClick={() => void sendEmailOtp()}
              >
                {sendingOtp ? "Sending…" : "Email me a sign-in code"}
              </Button>
            </Field>
          ) : (
            <>
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="code">
                  {mode === "backup" ? "Backup code" : "Verification code"}
                </FieldLabel>
                <Input
                  id="code"
                  inputMode={mode === "backup" ? "text" : "numeric"}
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
            </>
          )}

          <FieldDescription className="text-center">
            {mode !== "totp" ? (
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => changeMode("totp")}
              >
                Use authenticator app
              </button>
            ) : null}
            {mode !== "backup" ? (
              <>
                {mode !== "totp" ? " · " : null}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => changeMode("backup")}
                >
                  Use a backup code
                </button>
              </>
            ) : null}
            {mode !== "email" ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => changeMode("email")}
                >
                  Email me a code
                </button>
              </>
            ) : null}
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
