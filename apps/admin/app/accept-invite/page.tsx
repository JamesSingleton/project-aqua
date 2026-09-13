import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInviteContent } from "./accept-invite-content";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Join a swim team on Project Aqua.",
};

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
