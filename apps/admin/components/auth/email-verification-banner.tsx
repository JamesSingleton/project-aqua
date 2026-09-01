"use client";

import { sendVerificationEmail } from "@project-aqua/auth/client";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Button } from "@project-aqua/ui/components/button";
import { useState, useTransition } from "react";

export function EmailVerificationBanner({
  email,
  emailVerified,
}: {
  email: string;
  emailVerified: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (emailVerified) return null;

  function resend() {
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await sendVerificationEmail(
        { email },
        {
          onError(context) {
            setError(
              context.error.message ?? "Could not send verification email",
            );
          },
          onSuccess() {
            setMessage("Verification email sent — check your inbox.");
          },
        },
      );
      if (result.error) {
        setError(result.error.message ?? "Could not send verification email");
      }
    });
  }

  return (
    <Alert>
      <AlertTitle>Verify your email address</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <p>
          We sent a verification link to {email}. Verify your email to secure
          your account and receive important team notices.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-3"
          disabled={pending}
          onClick={resend}
        >
          {pending ? "Sending…" : "Resend verification email"}
        </Button>
        {message ? (
          <p className="text-foreground mt-2 text-sm">{message}</p>
        ) : null}
        {error ? (
          <p className="text-destructive mt-2 text-sm">{error}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
