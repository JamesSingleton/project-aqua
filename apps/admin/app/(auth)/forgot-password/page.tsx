"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setError("");
    const result = await requestPasswordReset({
      email: values.email,
      redirectTo: "/sign-in",
    });
    if (result.error) {
      setError(result.error.message ?? "Could not send reset email");
      return;
    }
    setSent(true);
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
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground text-sm text-balance">
              We&apos;ll email you a link to choose a new password.
            </p>
          </div>
          {error ? <FieldError>{error}</FieldError> : null}
          {sent ? (
            <p className="text-sm text-center">
              If an account exists for that email, a reset link is on its way.
            </p>
          ) : (
            <>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              </Field>
            </>
          )}
          <FieldDescription className="text-center">
            <Link href="/sign-in" className="underline underline-offset-4">
              Back to sign in
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthShell>
  );
}
