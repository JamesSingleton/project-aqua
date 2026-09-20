import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";

export const metadata: Metadata = {
  title: "Roster",
  description:
    "Add swimmers, import CL2/HY3 or CSV, assign groups, and keep club, high school, and college fields on the season enrollment.",
};

export default function RosterProductPage() {
  return (
    <FeaturePage
      title="A roster that survives the season change."
      description="Keep club and high school separate, on the same login. Archive a season and bring returning swimmers back without retyping birthdays."
      shot="roster"
    >
      <FeatureBlock title="What you record">
        <p>
          Name, date of birth, and gender are the core. Club teams keep a USA
          Swimming ID on the membership. High school keeps class year on the
          season enrollment. College keeps eligibility year.
        </p>
        <p>
          Training groups sit on the season, so varsity, age group, or senior
          can change without rewriting the person.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Import and export">
        <p>
          Bring a spreadsheet or a CL2/HY3 roster pack. Row-level errors stay
          visible instead of dropping names. Export CSV when you need a snapshot
          for staff.
        </p>
      </FeatureBlock>
      <FeatureBlock title="SWIMS and SafeSport">
        <p>
          USA Swimming club teams can sync the roster with SWIMS 3.0 on the free
          plan. SafeSport credential checks gate minor contact and medical
          fields.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
