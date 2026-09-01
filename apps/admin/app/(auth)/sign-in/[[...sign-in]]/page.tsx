import { getSession } from "@project-aqua/auth/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCallbackURL } from "@/lib/auth-callback";
import { getConfiguredSocialProviders } from "@/lib/auth-providers";
import { resolveTeamLandingPath } from "@/lib/resolve-team-landing";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Project Aqua account.",
};

export default async function SignInPage({
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
    const callback = getCallbackURL(query);
    if (callback === "/") {
      redirect(
        await resolveTeamLandingPath(
          session.user.id,
          session.session.activeOrganizationId,
        ),
      );
    }
    redirect(callback);
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
        <LoginForm socialProviders={socialProviders} />
      </Suspense>
    </AuthShell>
  );
}
