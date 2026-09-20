import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";

export const metadata: Metadata = {
  title: "Workouts",
  description:
    "Write practice sets, keep them on the team calendar, and review recent workouts from the dashboard.",
};

export default function WorkoutsProductPage() {
  return (
    <FeaturePage
      title="Practice lives next to the meet calendar."
      description="Create workouts for the team you are coaching today. Sets stay with the program, so a club practice does not leak onto the high school team."
      shot="workouts"
    >
      <FeatureBlock title="Write the set">
        <p>
          Build a workout, save it, and open it later from the team workout
          list. Quick actions from the sidebar get you to a blank set without
          hunting through menus.
        </p>
      </FeatureBlock>
      <FeatureBlock title="On the calendar">
        <p>
          Workouts show up beside practices and meets so the week is one
          calendar, not a separate planning tool. Attendance sessions sit on the
          same calendar.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
