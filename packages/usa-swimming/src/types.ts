export interface SwimsMember {
  memberId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  registrationStatus?: string;
  recordId?: string;
}

export interface SwimsClub {
  clubId: string;
  clubCode: string;
  clubName: string;
}

export type SwimsWebhookEvent =
  | "member.register"
  | "member.renew"
  | "member.transfer_to"
  | "member.transfer_from"
  | "member.cancel";

export interface SwimsWebhookPayload {
  event: SwimsWebhookEvent;
  clubId: string;
  memberId: string;
  recordId?: string;
  data?: Partial<SwimsMember>;
  /** Vendor delivery id when provided (preferred for idempotency). */
  deliveryId?: string;
  eventId?: string;
  id?: string;
  timestamp?: string | number;
  occurredAt?: string;
  eventTime?: string | number;
}
