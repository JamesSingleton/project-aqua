"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { cn } from "@project-aqua/ui/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({
  token,
  onSuccess,
  className,
  ...props
}: {
  token: string;
  onSuccess?: () => void;
} & React.ComponentProps<"form">) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setError("");
    const result = await resetPassword({
      newPassword: values.password,
      token,
    });
    if (result.error) {
      setError(result.error.message ?? "Could not reset password");
      return;
    }
    onSuccess?.();
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)(event);
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Choose a new password</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter a new password for your Project Aqua account.
          </p>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting || !token}>
            {isSubmitting ? "Saving…" : "Reset password"}
          </Button>
        </Field>
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/sign-in" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
