"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@project-aqua/design-system/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@project-aqua/design-system/components/ui/field";
import { Input } from "@project-aqua/design-system/components/ui/input";
import { cn } from "@project-aqua/design-system/lib/utils";
import Link from "next/link";
import { type ComponentProps, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { authClient } from "../client";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    passwordConfirmation: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps extends ComponentProps<"form"> {
  callbackURL?: string;
  onSuccess?: () => void;
  params?: URLSearchParams;
}

export function SignUpForm({
  className,
  callbackURL,
  onSuccess,
  params,
  ...props
}: SignUpFormProps) {
  const [loading, startTransition] = useTransition();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    startTransition(async () => {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        callbackURL,
        fetchOptions: {
          query: params ? Object.fromEntries(params.entries()) : undefined,
          onError: (ctx) => {
            console.error(ctx.error.message);
          },
          onSuccess: async () => {
            console.log("SUCCESS");
            onSuccess?.();
          },
        },
      });
    });
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-bold text-2xl">Create your account</h1>
          <p className="text-balance text-muted-foreground text-sm">
            Fill in the form below to create your account
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="firstName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-first-name">First name</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="given-name"
                  id="sign-up-first-name"
                  placeholder="Max"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="lastName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-up-last-name">Last name</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="family-name"
                  id="sign-up-last-name"
                  placeholder="Robinson"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="email"
                id="sign-up-email"
                placeholder="m@example.com"
                type="email"
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                id="sign-up-password"
                placeholder="Password"
                type="password"
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="passwordConfirmation"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-password-confirmation">
                Confirm Password
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="new-password"
                id="sign-up-password-confirmation"
                placeholder="Confirm Password"
                type="password"
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button type="submit">Create Account</Button>
          <FieldDescription className="px-6 text-center">
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
