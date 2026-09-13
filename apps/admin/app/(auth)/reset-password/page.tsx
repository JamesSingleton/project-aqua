import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordContent } from "./reset-password-content";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Project Aqua account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">Loading…</p>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AuthShell>
  );
}
