import { Text } from "@react-email/components";
import { EmailLayout, textStyle } from "../_layout.js";

export interface SafeSportTrainingRequiredProps {
  name: string;
  teamName: string;
  trainingUrl: string;
}

export default function SafeSportTrainingRequired({
  name,
  teamName,
  trainingUrl,
}: SafeSportTrainingRequiredProps) {
  return (
    <EmailLayout
      preview="SafeSport training required"
      heading="SafeSport training required"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        An action on <strong>{teamName}</strong> was blocked because your
        SafeSport training is not current. Complete training before accessing
        minor athlete contact or medical information.
      </Text>
      <Text style={textStyle}>
        Get trained at <a href={trainingUrl}>{trainingUrl}</a>
      </Text>
    </EmailLayout>
  );
}
