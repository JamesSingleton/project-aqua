import { getAiQuotaStatus } from "@project-aqua/db/queries/ai-quota";
import {
  getTeamPlan,
  getTeamSubscription,
} from "@project-aqua/db/queries/billing";
import { PLAN_LIMITS } from "@project-aqua/swim-core/plans";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Progress } from "@project-aqua/ui/components/progress";
import { Separator } from "@project-aqua/ui/components/separator";
import { Sparkles } from "lucide-react";
import { SettingsSection } from "../settings-section";
import { BillingActions } from "./billing-actions";

export default async function BillingSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [plan, subscription, quota] = await Promise.all([
    getTeamPlan(teamId),
    getTeamSubscription(teamId),
    getAiQuotaStatus(teamId),
  ]);
  const limits = PLAN_LIMITS[plan];
  const included = limits.aiGenerationsIncluded;
  const usagePct =
    included > 0 && included !== Number.POSITIVE_INFINITY
      ? Math.min(100, Math.round((quota.used / included) * 100))
      : 0;

  return (
    <div className="flex flex-col">
      {plan === "free" ? (
        <Alert className="mb-6">
          <Sparkles />
          <AlertTitle>You&apos;re on the Free plan</AlertTitle>
          <AlertDescription>
            Upgrade to Pro for more coaches, meet import, and higher AI limits.
          </AlertDescription>
        </Alert>
      ) : null}

      <SettingsSection
        title="Plan"
        description="Software access for this team via Polar."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium capitalize">{plan} plan</h4>
              <p className="text-muted-foreground text-sm">
                Status: {subscription?.status ?? "active"}
              </p>
            </div>
          </div>
          <Separator className="my-1" />
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            <li>
              Up to{" "}
              {limits.maxSwimmers === Number.POSITIVE_INFINITY
                ? "unlimited"
                : limits.maxSwimmers}{" "}
              swimmers
            </li>
            <li>
              Up to{" "}
              {limits.maxCoaches === Number.POSITIVE_INFINITY
                ? "unlimited"
                : limits.maxCoaches}{" "}
              coaches
            </li>
            <li>
              AI generations: {limits.aiGenerationsIncluded}/mo
              {limits.aiOverageAllowed ? " + overage" : " (hard stop)"}
            </li>
            <li>Meet import: {limits.meetImport ? "Yes" : "No"}</li>
            <li>Progression tracking: {limits.progression ? "Yes" : "No"}</li>
          </ul>
          <BillingActions teamId={teamId} currentPlan={plan} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="AI usage"
        description="Generations are metered per team for the current month."
        showSeparator
      >
        <div className="flex w-full max-w-md flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">This month</span>
            <span className="text-muted-foreground tabular-nums">
              {quota.used} /{" "}
              {included === Number.POSITIVE_INFINITY ? "∞" : included}
            </span>
          </div>
          <Progress value={usagePct} className="w-full" />
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Used {quota.used} generations
            </p>
            <p className="text-muted-foreground text-xs">
              {included === Number.POSITIVE_INFINITY
                ? "Unlimited included"
                : `${included} included`}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            {quota.overageAllowed && quota.remaining === 0
              ? "Included quota used — overage allowed on this plan."
              : `${quota.remaining} generations remaining.`}
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
