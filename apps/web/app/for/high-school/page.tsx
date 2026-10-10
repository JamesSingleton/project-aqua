import { FeatureBlock, FeaturePage } from "@/components/feature-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "For high school teams",
  "Duals and invitationals for high school coaches: class year, JV and Varsity, and association event limits, without a USA Swimming ID.",
);

export default function HighSchoolPage() {
  return (
    <FeaturePage
      title="For the dual and the invitational."
      description="Class year, JV and Varsity, and your association's event limits. The same login as the club team if you coach both."
    >
      <FeatureBlock title="Roster">
        <p>
          Freshman through senior lives on the season. A USA Swimming ID is not
          required to add a swimmer, and the high school roster does not wait on
          SWIMS.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Meets">
        <p>
          Duals and invitationals keep the JV and Varsity events from the host
          file. Association caps are your scoring limits: max names in an
          individual event, and max relay teams. Entry limits from the file —
          individual, relay, and combined — are checked before you export.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Beside the club team">
        <p>
          If you also coach a club, switch teams without signing out. Times and
          entries stay with each team. After a meet, you can turn on a high
          school cut you entered, the same way a club coach turns on JO or
          sectionals.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
