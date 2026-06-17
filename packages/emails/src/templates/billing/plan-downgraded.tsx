import { Text } from "@react-email/components";
import { EmailLayout, textStyle } from "../_layout.js";

export interface PlanDowngradedProps {
  name: string;
  teamName: string;
}

export default function PlanDowngraded({
  name,
  teamName,
}: PlanDowngradedProps) {
  return (
    <EmailLayout preview="Plan changed" heading="Plan updated">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        <strong>{teamName}</strong> has been moved to the Free plan. Some
        features may no longer be available.
      </Text>
    </EmailLayout>
  );
}
