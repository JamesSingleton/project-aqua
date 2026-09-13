import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface SafeSportTrainingExpiringProps {
  name: string;
  teamName: string;
  expiresAt: string;
  trainingUrl: string;
}

export default function SafeSportTrainingExpiring({
  name,
  teamName,
  expiresAt,
  trainingUrl,
}: SafeSportTrainingExpiringProps) {
  return (
    <EmailLayout
      preview="SafeSport training expiring soon"
      heading="SafeSport training expiring"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Your SafeSport training for <strong>{teamName}</strong> expires on{" "}
        {expiresAt}. Renew before it lapses to retain access to minor athlete
        roster data.
      </Text>
      <Text style={textStyle}>
        Complete training at <a href={trainingUrl}>{trainingUrl}</a>
      </Text>
    </EmailLayout>
  );
}
