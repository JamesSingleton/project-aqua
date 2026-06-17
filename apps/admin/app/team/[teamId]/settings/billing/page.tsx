import {
  getTeamPlan,
  getTeamSubscription,
} from "@project-aqua/db/queries/billing";
import { PLAN_LIMITS } from "@project-aqua/swim-core/plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { BillingActions } from "./billing-actions";

export default async function BillingSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [plan, subscription] = await Promise.all([
    getTeamPlan(teamId),
    getTeamSubscription(teamId),
  ]);
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your team subscription</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{plan} plan</CardTitle>
          <CardDescription>
            Status: {subscription?.status ?? "active"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-muted-foreground space-y-1 text-sm">
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
            <li>Meet import: {limits.meetImport ? "Yes" : "No"}</li>
            <li>Progression tracking: {limits.progression ? "Yes" : "No"}</li>
            <li>USA Swimming sync: {limits.swimsSync ? "Yes" : "No"}</li>
          </ul>
          <BillingActions teamId={teamId} currentPlan={plan} />
        </CardContent>
      </Card>
    </div>
  );
}
