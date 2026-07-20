import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
