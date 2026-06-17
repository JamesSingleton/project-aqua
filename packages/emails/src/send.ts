import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { getEmailFrom, getResendClient } from "./client.js";

export type EmailType =
  | "verify-email"
  | "reset-password"
  | "password-changed"
  | "coach-welcome"
  | "team-welcome"
  | "coach-invitation"
  | "invitation-accepted"
  | "role-changed"
  | "removed-from-team"
  | "member-joined"
  | "subscription-confirmed"
  | "payment-failed"
  | "subscription-renewed"
  | "plan-downgraded"
  | "roster-import-complete"
  | "roster-import-failed"
  | "meet-import-complete"
  | "swims-sync-summary"
  | "maapp-acknowledgment-request"
  | "safesport-training-expiring"
  | "safesport-training-required";

export interface EmailProps {
  "verify-email": { name: string; url: string };
  "reset-password": { name: string; url: string };
  "password-changed": { name: string };
  "coach-welcome": { name: string; dashboardUrl: string };
  "team-welcome": {
    name: string;
    teamName: string;
    teamId: string;
    baseUrl: string;
  };
  "coach-invitation": {
    inviterName: string;
    teamName: string;
    inviteUrl: string;
    role: string;
  };
  "invitation-accepted": { inviteeName: string; teamName: string };
  "role-changed": { name: string; teamName: string; newRole: string };
  "removed-from-team": { name: string; teamName: string };
  "member-joined": { memberName: string; teamName: string };
  "subscription-confirmed": {
    name: string;
    teamName: string;
    plan: string;
    billingUrl: string;
  };
  "payment-failed": { name: string; teamName: string; billingUrl: string };
  "subscription-renewed": { name: string; teamName: string; plan: string };
  "plan-downgraded": { name: string; teamName: string };
  "roster-import-complete": {
    teamName: string;
    added: number;
    updated: number;
  };
  "roster-import-failed": { teamName: string; errorSummary: string };
  "meet-import-complete": {
    teamName: string;
    meetName: string;
    eventsCount: number;
    entriesCount: number;
  };
  "swims-sync-summary": {
    teamName: string;
    added: number;
    updated: number;
    removed: number;
  };
  "maapp-acknowledgment-request": {
    teamName: string;
    swimmerName: string;
    acknowledgeUrl: string;
    parentName?: string;
  };
  "safesport-training-expiring": {
    name: string;
    teamName: string;
    expiresAt: string;
    trainingUrl: string;
  };
  "safesport-training-required": {
    name: string;
    teamName: string;
    trainingUrl: string;
  };
}

const SUBJECTS: Record<EmailType, string> = {
  "verify-email": "Verify your email — Project Aqua",
  "reset-password": "Reset your password — Project Aqua",
  "password-changed": "Your password was changed — Project Aqua",
  "coach-welcome": "Welcome to Project Aqua!",
  "team-welcome": "Your team is ready — Project Aqua",
  "coach-invitation": "You've been invited to join a team",
  "invitation-accepted": "Invitation accepted",
  "role-changed": "Your role was updated",
  "removed-from-team": "Team access removed",
  "member-joined": "New team member joined",
  "subscription-confirmed": "Subscription confirmed",
  "payment-failed": "Payment failed — action required",
  "subscription-renewed": "Subscription renewed",
  "plan-downgraded": "Plan updated",
  "roster-import-complete": "Roster import complete",
  "roster-import-failed": "Roster import failed",
  "meet-import-complete": "Meet import complete",
  "swims-sync-summary": "USA Swimming sync complete",
  "maapp-acknowledgment-request": "MAAPP acknowledgment required",
  "safesport-training-expiring": "SafeSport training expiring soon",
  "safesport-training-required": "SafeSport training required",
};

type TemplateLoader = () => Promise<{
  default: (props: EmailProps[EmailType]) => ReactElement;
}>;

const TEMPLATE_LOADERS: Record<EmailType, TemplateLoader> = {
  "verify-email": () => import("./templates/auth/verify-email.js"),
  "reset-password": () => import("./templates/auth/reset-password.js"),
  "password-changed": () => import("./templates/auth/password-changed.js"),
  "coach-welcome": () => import("./templates/onboarding/coach-welcome.js"),
  "team-welcome": () => import("./templates/onboarding/team-welcome.js"),
  "coach-invitation": () => import("./templates/team/coach-invitation.js"),
  "invitation-accepted": () =>
    import("./templates/team/invitation-accepted.js"),
  "role-changed": () => import("./templates/team/role-changed.js"),
  "removed-from-team": () => import("./templates/team/removed-from-team.js"),
  "member-joined": () => import("./templates/team/member-joined.js"),
  "subscription-confirmed": () =>
    import("./templates/billing/subscription-confirmed.js"),
  "payment-failed": () => import("./templates/billing/payment-failed.js"),
  "subscription-renewed": () =>
    import("./templates/billing/subscription-renewed.js"),
  "plan-downgraded": () => import("./templates/billing/plan-downgraded.js"),
  "roster-import-complete": () =>
    import("./templates/ops/roster-import-complete.js"),
  "roster-import-failed": () =>
    import("./templates/ops/roster-import-failed.js"),
  "meet-import-complete": () =>
    import("./templates/ops/meet-import-complete.js"),
  "swims-sync-summary": () => import("./templates/ops/swims-sync-summary.js"),
  "maapp-acknowledgment-request": () =>
    import("./templates/safesport/maapp-acknowledgment-request.js"),
  "safesport-training-expiring": () =>
    import("./templates/safesport/safesport-training-expiring.js"),
  "safesport-training-required": () =>
    import("./templates/safesport/safesport-training-required.js"),
};

export type SendEmailOptions<T extends EmailType> = {
  type: T;
  to: string | string[];
  props: EmailProps[T];
  idempotencyKey?: string;
};

export async function sendEmail<T extends EmailType>(
  opts: SendEmailOptions<T>,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email skipped] ${opts.type} → ${opts.to}`);
    return;
  }

  const loader = TEMPLATE_LOADERS[opts.type];
  const mod = await loader();
  const html = await render(mod.default(opts.props as EmailProps[EmailType]));

  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: SUBJECTS[opts.type],
    html,
    ...(opts.idempotencyKey && {
      headers: { "Idempotency-Key": opts.idempotencyKey },
    }),
  });

  if (error) {
    console.error(`Failed to send ${opts.type}:`, error);
    throw new Error(error.message);
  }
}
