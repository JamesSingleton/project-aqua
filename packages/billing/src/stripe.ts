import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
} as const;

export async function createCheckoutSession(
  organizationId: string,
  plan: "pro" | "enterprise",
  customerEmail: string,
  successUrl: string,
  cancelUrl: string,
) {
  const stripe = getStripe();
  const priceId = STRIPE_PRICES[plan];
  if (!priceId) {
    throw new Error(`Stripe price not configured for plan: ${plan}`);
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { organizationId, plan },
  });
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function createStripeCustomer(
  email: string,
  organizationId: string,
) {
  const stripe = getStripe();
  return stripe.customers.create({
    email,
    metadata: { organizationId },
  });
}
