import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";

export const metadata: Metadata = {
  title: "Progression",
  description:
    "Best times by course, season charts, CSV import, time standards, and top-times reports scoped to the current team.",
};

export default function ProgressionProductPage() {
  return (
    <FeaturePage
      title="Times that stay attached to the right team."
      description="Best times, season charts, and cuts are scoped to the program you are coaching. An athlete who also swims for your club team does not rewrite the high school progression."
      shot="progression"
    >
      <FeatureBlock title="Best times">
        <p>
          Course and event, with meet name and date after a results import. Add
          a time trial by hand when the file has not arrived. Bulk-load history
          from CSV at season start.
        </p>
      </FeatureBlock>
      <FeatureBlock title="After the meet">
        <p>
          Results import writes faster swims here. On the meet itself you can
          still toggle a time-standard set to see who went under without leaving
          the heat sheet.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Cuts and top times">
        <p>
          Track qualifying, motivational, and team-record standards against the
          roster. Filter by training group when you only want one cohort. Team
          top times by event staff relays before you guess from memory.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
