import { db } from "@project-aqua/db/client";
import {
  getOwnerEmail,
  getTeamSubscription,
  updateSubscription,
} from "@project-aqua/db/queries/billing";
import { organization } from "@project-aqua/db/schema";
import {
  sendPaymentFailed,
  sendPlanDowngraded,
  sendSubscriptionConfirmed,
  sendSubscriptionRenewed,
} from "@project-aqua/emails";
import type { PlanTier } from "@project-aqua/swim-core/plans";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getStripe } from "./stripe";

export async function handleStripeWebhook(
  body: string,
  signature: string,
): Promise<void> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organizationId;
      const plan = session.metadata?.plan as PlanTier | undefined;
      if (!organizationId || !plan) break;

      await updateSubscription(organizationId, {
        plan,
        status: "active",
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      });

      await db
        .update(organization)
        .set({ metadata: JSON.stringify({ plan }) })
        .where(eq(organization.id, organizationId));

      const ownerEmail = await getOwnerEmail(organizationId);
      if (ownerEmail) {
        const [org] = await db
          .select()
          .from(organization)
          .where(eq(organization.id, organizationId))
          .limit(1);
        await sendSubscriptionConfirmed(ownerEmail, {
          name: "Coach",
          teamName: org?.name ?? "Your team",
          plan,
          teamId: organizationId,
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const sub = await findSubscriptionByCustomer(customerId);
      if (!sub) break;

      await updateSubscription(sub.organizationId, { status: "past_due" });
      const ownerEmail = await getOwnerEmail(sub.organizationId);
      if (ownerEmail) {
        const [org] = await db
          .select()
          .from(organization)
          .where(eq(organization.id, sub.organizationId))
          .limit(1);
        await sendPaymentFailed(ownerEmail, {
          name: "Coach",
          teamName: org?.name ?? "Your team",
          teamId: sub.organizationId,
        });
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.billing_reason?.includes("subscription")) break;
      const customerId = invoice.customer as string;
      const sub = await findSubscriptionByCustomer(customerId);
      if (!sub) break;

      const ownerEmail = await getOwnerEmail(sub.organizationId);
      if (ownerEmail) {
        const [org] = await db
          .select()
          .from(organization)
          .where(eq(organization.id, sub.organizationId))
          .limit(1);
        await sendSubscriptionRenewed(ownerEmail, {
          name: "Coach",
          teamName: org?.name ?? "Your team",
          plan: sub.plan,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await findSubscriptionByStripeId(subscription.id);
      if (!sub) break;

      await updateSubscription(sub.organizationId, {
        plan: "free",
        status: "canceled",
      });

      const ownerEmail = await getOwnerEmail(sub.organizationId);
      if (ownerEmail) {
        const [org] = await db
          .select()
          .from(organization)
          .where(eq(organization.id, sub.organizationId))
          .limit(1);
        await sendPlanDowngraded(ownerEmail, {
          name: "Coach",
          teamName: org?.name ?? "Your team",
        });
      }
      break;
    }
  }
}

async function findSubscriptionByCustomer(customerId: string) {
  const { subscriptions } = await import("@project-aqua/db/schema");
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  return sub ?? null;
}

async function findSubscriptionByStripeId(stripeSubscriptionId: string) {
  const { subscriptions } = await import("@project-aqua/db/schema");
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return sub ?? null;
}
