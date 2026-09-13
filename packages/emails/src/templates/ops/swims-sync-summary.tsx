import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface SwimsSyncSummaryProps {
  teamName: string;
  added: number;
  updated: number;
  removed: number;
}

export default function SwimsSyncSummary({
  teamName,
  added,
  updated,
  removed,
}: SwimsSyncSummaryProps) {
  return (
    <EmailLayout
      preview="USA Swimming sync complete"
      heading="SWIMS sync complete"
    >
      <Text style={textStyle}>
        USA Swimming roster sync for <strong>{teamName}</strong> is complete.
      </Text>
      <Text style={textStyle}>
        Added: {added} · Updated: {updated} · Removed: {removed}
      </Text>
    </EmailLayout>
  );
}
