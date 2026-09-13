import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — emails will be skipped");
      resendClient = new Resend("re_placeholder");
    } else {
      resendClient = new Resend(apiKey);
    }
  }
  return resendClient;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "Project Aqua <onboarding@resend.dev>";
}

export function getBaseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
}
