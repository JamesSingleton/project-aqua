import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { CheckEmailForm } from "@/components/auth/check-email-form";

export const metadata: Metadata = {
  title: "Check your email",
  description:
    "Verify your email to finish creating your Project Aqua account.",
};

export default function CheckEmailPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">
            Loading...
          </p>
        }
      >
        <CheckEmailForm />
      </Suspense>
    </AuthShell>
  );
}
