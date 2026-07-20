import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface RemovedFromTeamProps {
  name: string;
  teamName: string;
}

export default function RemovedFromTeam({
  name,
  teamName,
}: RemovedFromTeamProps) {
  return (
    <EmailLayout
      preview={`Removed from ${teamName}`}
      heading="Team access removed"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        You have been removed from <strong>{teamName}</strong> on Project Aqua.
      </Text>
    </EmailLayout>
  );
}
