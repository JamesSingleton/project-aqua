import { getSession } from "@project-aqua/auth/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getCallbackURL } from "@/lib/auth-callback";
import { getConfiguredSocialProviders } from "@/lib/auth-providers";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Project Aqua account to manage your swim team.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session?.user?.id) {
    const params = await searchParams;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
      else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
    }
    redirect(getCallbackURL(query, "/onboarding"));
  }

  const socialProviders = getConfiguredSocialProviders();

  return (
    <AuthShell>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">
            Loading...
          </p>
        }
      >
        <SignupForm socialProviders={socialProviders} />
      </Suspense>
    </AuthShell>
  );
}
