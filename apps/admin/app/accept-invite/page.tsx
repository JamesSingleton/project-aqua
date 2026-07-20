import { Suspense } from "react";
import { AcceptInviteContent } from "./accept-invite-content";

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
