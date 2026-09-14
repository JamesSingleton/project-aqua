import { Resend } from "resend";
import { keys } from "./keys";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = keys().RESEND_API_KEY;
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
  return keys().EMAIL_FROM ?? "Project Aqua <onboarding@resend.dev>";
}

export function getBaseUrl(): string {
  // Validated as required on auth; optional here so emails can soft-fallback.
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
}
