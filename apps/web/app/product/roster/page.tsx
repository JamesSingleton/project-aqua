import { FeatureBlock, FeaturePage } from "@/components/feature-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Roster",
  "Add swimmers, import CL2, HY3, SD3, or CSV, assign training groups, and keep club and high school fields on the season.",
);

export default function RosterProductPage() {
  return (
    <FeaturePage
      title="A roster that survives the season change."
      description="Club and high school stay separate, on the same login. Start a new season and bring returning swimmers forward without retyping birthdays."
      shot="roster"
    >
      <FeatureBlock title="What you record">
        <p>
          Name, date of birth, and gender are the core. A club team can store a
          USA Swimming ID on the membership. A high school team stores class
          year — freshman through senior — on the season. A college team can
          record academic standing and eligibility status on the season.
          Training groups sit on the season, so senior, age group, or varsity
          can change without rewriting the person.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Import and export">
        <p>
          Bring a CSV, or a CL2, HY3, or SD3 roster pack. Row-level errors stay
          on the preview. Export CSV when staff need a snapshot.
        </p>
      </FeatureBlock>
      <FeatureBlock title="SWIMS and SafeSport, for club teams">
        <p>
          A USA Swimming club can sync roster registration with SWIMS on the
          free plan. SafeSport checks gate minor contact and medical fields.
          When training or a minor&apos;s acknowledgment is missing, the
          dashboard says so. High school teams do not use either. Lane4 HQ is
          not certified or approved by USA Swimming.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
