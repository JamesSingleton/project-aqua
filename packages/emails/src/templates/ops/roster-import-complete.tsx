import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface RosterImportCompleteProps {
  teamName: string;
  added: number;
  updated: number;
}

export default function RosterImportComplete({
  teamName,
  added,
  updated,
}: RosterImportCompleteProps) {
  return (
    <EmailLayout
      preview="Roster import complete"
      heading="Roster import complete"
    >
      <Text style={textStyle}>
        Your roster import for <strong>{teamName}</strong> is complete.
      </Text>
      <Text style={textStyle}>
        Added: {added} swimmers · Updated: {updated}
      </Text>
    </EmailLayout>
  );
}
