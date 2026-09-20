import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";

export const metadata: Metadata = {
  title: "For high school teams",
  description:
    "Class year, JV/Varsity divisions, association event caps, and dual-meet files without club-only compliance.",
};

export default function HighSchoolPage() {
  return (
    <FeaturePage
      title="High school without a USA Swimming ID."
      description="Class year, JV and Varsity, and your association's event limits. Same login as the club team if you coach both."
    >
      <FeatureBlock title="Roster">
        <p>
          Freshman through senior on the season, not as a club membership field.
          No USA Swimming ID required to add a swimmer.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Meets">
        <p>
          Duals and invitationals keep JV and Varsity events. Caps are your
          association&apos;s scoring limits: max names in an event, max relay
          teams.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Beside the club team">
        <p>
          If you also coach a club, switch teams without signing out. Times and
          entries stay with each team. High school doesn&apos;t wait on club
          SWIMS work.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
