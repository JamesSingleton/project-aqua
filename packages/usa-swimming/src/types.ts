/** Partner API (`SwimsEvent` / `SwimsEventData`) — see SWIMS Swagger. */
export interface SwimsEventData {
  vendorRecordId?: string | null;
  memberIds?: string[] | null;
  clubIds?: string[] | null;
  oldClubId?: string | null;
  oldMemberId?: string | null;
  newClubId?: string | null;
  newMemberId?: string | null;
}

/** Membership change notification from `/swims/SwimsThirdParty/EventsWithinDateTime` / vendor push. */
export interface SwimsEvent {
  eventSequence: number;
  eventTypeId: number;
  eventType?: string | null;
  clubId?: string | null;
  modifiedDatetime: string;
  eventData?: SwimsEventData | null;
}

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

/** Normalized payload used after parsing vendor JSON. */
export interface SwimsWebhookPayload {
  event: SwimsWebhookEvent;
  clubId: string;
  memberId: string;
  recordId?: string;
  eventSequence?: number;
  modifiedDatetime?: string;
  /** Raw SWIMS `eventType` when supplied. */
  eventType?: string;
}
