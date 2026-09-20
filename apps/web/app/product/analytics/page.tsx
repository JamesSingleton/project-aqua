import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";
import { ProductShot } from "@/components/product-shot";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Training volume, attendance, team top times, and Pro cut tracking from the practices and results you already have.",
};

export default function AnalyticsProductPage() {
  return (
    <FeaturePage
      title="Who dropped. Who made the cut. Who was on deck."
      description="Attendance, yardage, and top times from the practices and meets you already ran. No extra spreadsheet."
      shot="analytics"
    >
      <ProductShot shot="cutTracker" />
      <FeatureBlock title="Volume and attendance">
        <p>
          Seven-day and thirty-day yardage, plus who showed up. That's the roll
          you already took. Use it before you name a relay or ask why a 200 died
          on Saturday.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Team top times">
        <p>
          Fastest best times grouped by event, swimmer, or course. Filter the
          roster when you are staffing a relay, not reconstructing last year’s
          PDF.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Cut tracker on Pro">
        <p>
          Import JO, sectionals, or a team standard. Anyone already at or under
          the cut shows up in one list, with their time next to the standard.
          Free still keeps best times and results. Pro is the roster-wide cut
          view.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
