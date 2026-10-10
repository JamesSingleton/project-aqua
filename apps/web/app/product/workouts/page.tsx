import { FeatureBlock, FeaturePage } from "@/components/feature-page";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Workouts",
  "Write practice sets, keep them on the team calendar, and open a saved workout from the team list.",
);

export default function WorkoutsProductPage() {
  return (
    <FeaturePage
      title="Practice lives next to the meet calendar."
      description="Write workouts for the team you have open. A club set does not land on the high school calendar."
      shot="workouts"
    >
      <FeatureBlock title="Write the set">
        <p>
          Build a workout, save it, and open it later from the team list. A
          sidebar shortcut opens a blank set. If you want a starting draft,
          suggest a practice from a focus and a duration. Those drafts share a
          monthly pool with relay-order suggestions.
        </p>
      </FeatureBlock>
      <FeatureBlock title="On the calendar">
        <p>
          Workouts sit beside practices and meets, so the week is one calendar.
          Attendance for those sessions is on the same calendar.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
