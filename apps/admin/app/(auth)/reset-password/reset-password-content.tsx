"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="text-muted-foreground text-sm">
          This password reset link is missing or expired. Request a new one from
          the sign-in page.
        </p>
      </div>
    );
  }

  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => router.push("/sign-in")}
    />
  );
}
