import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Project Aqua account.",
};

export default function SignInPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">
            Loading...
          </p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
