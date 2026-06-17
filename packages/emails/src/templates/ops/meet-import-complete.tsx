import { Text } from "@react-email/components";
import { EmailLayout, textStyle } from "../_layout.js";

export interface MeetImportCompleteProps {
  teamName: string;
  meetName: string;
  eventsCount: number;
  entriesCount: number;
}

export default function MeetImportComplete({
  teamName,
  meetName,
  eventsCount,
  entriesCount,
}: MeetImportCompleteProps) {
  return (
    <EmailLayout preview="Meet import complete" heading="Meet import complete">
      <Text style={textStyle}>
        <strong>{meetName}</strong> for <strong>{teamName}</strong> was imported
        successfully.
      </Text>
      <Text style={textStyle}>
        Events: {eventsCount} · Entries: {entriesCount}
      </Text>
    </EmailLayout>
  );
}
