import { FeatureBlock, FeaturePage } from "@/components/feature-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "For club teams",
  "Invitational meet weeks for USA Swimming club coaches: roster ID, SWIMS sync, SafeSport checks, and cuts such as JO or sectionals. Lane4 HQ is not USA Swimming certified.",
);

export default function ClubPage() {
  return (
    <FeaturePage
      title="For the club invitational."
      description="The same meet week as the high school, with the club fields: a USA Swimming ID, SWIMS sync, and SafeSport checks. SWIMS sync is on the free plan."
    >
      <FeatureBlock title="Membership">
        <p>
          Store the USA Swimming ID on the swimmer so the roster has the
          identifier SWIMS uses. Sync pulls registration for the club you
          connect. Lane4 HQ is not certified or approved by USA Swimming.
        </p>
      </FeatureBlock>
      <FeatureBlock title="SafeSport">
        <p>
          Minor contact and medical fields stay behind a current SafeSport
          check. When training or a minor&apos;s acknowledgment is missing, the
          dashboard says so.
        </p>
      </FeatureBlock>
      <FeatureBlock title="The meet">
        <p>
          Import the invitational event file, enter the club lineup, export the
          HY3 or CL2 the host asked for, and import results. After the meet,
          compare a cut you entered, such as JO or sectionals. If you also coach
          a high school, that team keeps its own roster, entries, and times.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
