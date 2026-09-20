import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";

export const metadata: Metadata = {
  title: "For club teams",
  description:
    "SWIMS roster sync, SafeSport gating, and Hy-Tek interchange for USA Swimming club coaches.",
};

export default function ClubPage() {
  return (
    <FeaturePage
      title="Club teams, with SWIMS on the free plan."
      description="Sync the roster with SWIMS. Keep SafeSport checks on. Same meet week as every other team you coach."
    >
      <FeatureBlock title="Membership">
        <p>
          Store the USA Swimming ID on the swimmer membership so SWIMS and later
          compliance work have the right identifier. Sync keeps the roster
          aligned with national membership data.
        </p>
      </FeatureBlock>
      <FeatureBlock title="SafeSport">
        <p>
          Minor contact and medical fields stay behind credential verification.
          Teams that require SafeSport see a compliance summary on the
          dashboard.
        </p>
      </FeatureBlock>
      <FeatureBlock title="The meet">
        <p>
          Import the invitational event file, enter the club lineup, export the
          HY3 they asked for, import results. Same week as every other program.
          Club-only extras do not block high school.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
