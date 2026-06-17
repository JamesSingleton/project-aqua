"use client";

import type { PlanTier } from "@project-aqua/swim-core/plans";
import { Button } from "@project-aqua/ui/components/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { openBillingPortalAction, startCheckoutAction } from "./actions";

export function BillingActions({
  teamId,
  currentPlan,
}: {
  teamId: string;
  currentPlan: PlanTier;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: "pro" | "enterprise") {
    setLoading(plan);
    try {
      const url = await startCheckoutAction(teamId, plan);
      if (url) window.location.href = url;
    } catch (error) {
      console.error(error);
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const url = await openBillingPortalAction(teamId);
      if (url) window.location.href = url;
    } catch (error) {
      console.error(error);
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentPlan === "free" && (
        <>
          <Button onClick={() => handleUpgrade("pro")} disabled={!!loading}>
            {loading === "pro" ? "Loading..." : "Upgrade to Pro"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleUpgrade("enterprise")}
            disabled={!!loading}
          >
            {loading === "enterprise" ? "Loading..." : "Upgrade to Enterprise"}
          </Button>
        </>
      )}
      {currentPlan !== "free" && (
        <Button onClick={handlePortal} disabled={!!loading}>
          {loading === "portal" ? "Loading..." : "Manage billing"}
        </Button>
      )}
    </div>
  );
}
