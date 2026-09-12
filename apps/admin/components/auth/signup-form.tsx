"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signUp } from "@project-aqua/auth/client";
import { Button } from "@project-aqua/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/ui/components/field";
import { Input } from "@project-aqua/ui/components/input";
import { cn } from "@project-aqua/ui/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { getCallbackURL } from "@/lib/auth-callback";
import type { SocialProvider } from "@/lib/auth-providers";

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your full name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({
  socialProviders = [],
  className,
  ...props
}: React.ComponentProps<"form"> & {
  socialProviders?: SocialProvider[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getCallbackURL(searchParams, "/onboarding");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signInHref = searchParams.get("callbackUrl")
    ? `/sign-in?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}`
    : "/sign-in";

  async function onSubmit(values: SignupFormValues) {
    setError("");

    const result = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: callbackUrl,
      fetchOptions: {
        query: Object.fromEntries(searchParams.entries()),
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Sign up failed");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <form
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
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Start managing your swim team with Project Aqua
            </p>
          </div>
          {error ? <FieldError>{error}</FieldError> : null}
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Alex Rivera"
              autoComplete="name"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="coach@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldDescription>
              We&apos;ll use this for team invites and account notices.
            </FieldDescription>
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldDescription>Must be at least 8 characters.</FieldDescription>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href={signInHref} className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
      <SocialAuthButtons
        providers={socialProviders}
        callbackURL={callbackUrl}
        queryParams={searchParams}
      />
    </div>
  );
}
