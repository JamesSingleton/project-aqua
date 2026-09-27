"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { sendVerificationEmail } from "@project-aqua/auth/client";
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
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

type ResendFormValues = z.infer<typeof resendSchema>;

export function CheckEmailForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: emailFromQuery },
  });

  async function onSubmit(values: ResendFormValues) {
    setError("");
    setMessage("");
    const result = await sendVerificationEmail({ email: values.email });
    if (result.error) {
      setError(result.error.message ?? "Could not send verification email");
      return;
    }
    setMessage("Verification email sent — check your inbox.");
  }

  return (
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
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {emailFromQuery
              ? `We sent a verification link to ${emailFromQuery}. Open it to finish creating your account.`
              : "We sent a verification link to your inbox. Open it to finish creating your account."}
          </p>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        {message ? <p className="text-center text-sm">{message}</p> : null}
        {emailFromQuery ? (
          <input type="hidden" {...register("email")} />
        ) : (
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
        )}
        <Field>
          <Button type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Resend verification email"}
          </Button>
        </Field>
        <FieldDescription className="text-center">
          Already verified?{" "}
          <Link
            href="/sign-in"
            className="underline underline-offset-4"
            prefetch={false}
          >
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
