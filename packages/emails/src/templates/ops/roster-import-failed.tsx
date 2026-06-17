import { Text } from "@react-email/components";
import { EmailLayout, textStyle } from "../_layout.js";

export interface RosterImportFailedProps {
  teamName: string;
  errorSummary: string;
}

export default function RosterImportFailed({
  teamName,
  errorSummary,
}: RosterImportFailedProps) {
  return (
    <EmailLayout preview="Roster import failed" heading="Roster import failed">
      <Text style={textStyle}>
        Your roster import for <strong>{teamName}</strong> failed.
      </Text>
      <Text style={textStyle}>{errorSummary}</Text>
    </EmailLayout>
  );
}
