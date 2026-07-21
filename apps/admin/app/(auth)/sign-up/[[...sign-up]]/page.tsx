import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Project Aqua account to manage your swim team.",
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
