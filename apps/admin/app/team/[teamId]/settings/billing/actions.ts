"use server";

import { getSession } from "@project-aqua/auth/session";
import {
  createBillingPortalSession,
  createCheckoutSession,
  createStripeCustomer,
} from "@project-aqua/billing/stripe";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  getTeamSubscription,
  updateSubscription,
} from "@project-aqua/db/queries/billing";
import { getBaseUrl } from "@project-aqua/emails/client";

export async function startCheckoutAction(
  teamId: string,
  plan: "pro" | "enterprise",
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner"]);

  if (!session?.user?.email) {
    throw new Error("User email required");
  }

  const baseUrl = getBaseUrl();
  const sub = await getTeamSubscription(teamId);

  let customerId = sub?.stripeCustomerId;
  if (!customerId) {
    const customer = await createStripeCustomer(session.user.email, teamId);
    customerId = customer.id;
    await updateSubscription(teamId, { stripeCustomerId: customerId });
  }

  const checkout = await createCheckoutSession(
    teamId,
    plan,
    session.user.email,
    `${baseUrl}/team/${teamId}/settings/billing?success=true`,
    `${baseUrl}/team/${teamId}/settings/billing`,
  );

  return checkout.url;
}

export async function openBillingPortalAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner"]);

  const sub = await getTeamSubscription(teamId);
  if (!sub?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const baseUrl = getBaseUrl();
  const portal = await createBillingPortalSession(
    sub.stripeCustomerId,
    `${baseUrl}/team/${teamId}/settings/billing`,
  );

  return portal.url;
}
