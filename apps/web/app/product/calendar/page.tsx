import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Team calendar for practices and meets, attendance roll, recurring schedules, and Google or Microsoft calendar sync.",
};

export default function CalendarProductPage() {
  return (
    <FeaturePage
      title="Practices and meets on one calendar."
      description="Practices, meets, and attendance live on the team calendar. Subscribe from Google or Microsoft, or pull an ICS feed when you need a read-only copy."
      shot="calendar"
    >
      <FeatureBlock title="Schedule">
        <p>
          Add one-off sessions or a recurring practice pattern. Meets you
          created or imported appear on the same calendar so entry deadlines are
          not hiding in email.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Attendance">
        <p>
          Take roll for a session from the calendar or the attendance list.
          History stays with the team so you can see who has been on deck before
          you name a relay.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Sync">
        <p>
          Connect Google Calendar or Microsoft Calendar, or share the team ICS
          feed. The feed is scoped to that team. Switching programs in the app
          does not mix the two schedules.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
