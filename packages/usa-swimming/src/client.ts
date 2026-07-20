import type { SwimsClub, SwimsMember } from "./types";

const SWIMS_BASE_URL =
  process.env.USA_SWIMMING_API_URL ??
  "https://thirdparty-api-documentation.swimsmember.org";

export class SwimsClient {
  private thumbprint: string;

  constructor() {
    this.thumbprint = process.env.USA_SWIMMING_VENDOR_THUMBPRINT ?? "";
  }

  private async request<T>(path: string): Promise<T> {
    if (!this.thumbprint) {
      throw new Error("USA_SWIMMING_VENDOR_THUMBPRINT is not configured");
    }

    const response = await fetch(`${SWIMS_BASE_URL}${path}`, {
      headers: {
        "X-Vendor-Thumbprint": this.thumbprint,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `SWIMS API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async getVendorClubs(): Promise<SwimsClub[]> {
    return this.request<SwimsClub[]>("/swims/getVendorClubs/vendor");
  }

  async getMemberDetails(
    clubId: string,
    memberId: string,
  ): Promise<SwimsMember> {
    return this.request<SwimsMember>(
      `/swims/getMemberDetails/${clubId}/?memberId=${memberId}`,
    );
  }

  async getClubMembers(clubId: string): Promise<SwimsMember[]> {
    return this.request<SwimsMember[]>(
      `/swims/getMemberDetails/club/${clubId}`,
    );
  }

  async generateRegistrationLink(clubId: string): Promise<string> {
    const result = await this.request<{ url: string }>(
      `/club/generateregistrationlink?clubId=${clubId}`,
    );
    return result.url;
  }
}

export function createSwimsClient(): SwimsClient {
  return new SwimsClient();
}
