import { Text } from "@react-email/components";
import { EmailLayout, textStyle } from "../_layout.js";

export interface MaappAcknowledgmentRequestProps {
  teamName: string;
  swimmerName: string;
  acknowledgeUrl: string;
  parentName?: string;
}

export default function MaappAcknowledgmentRequest({
  teamName,
  swimmerName,
  acknowledgeUrl,
  parentName,
}: MaappAcknowledgmentRequestProps) {
  return (
    <EmailLayout
      preview={`MAAPP acknowledgment required for ${swimmerName}`}
      heading="MAAPP acknowledgment required"
    >
      <Text style={textStyle}>
        {parentName ? `Hello ${parentName},` : "Hello,"}
      </Text>
      <Text style={textStyle}>
        <strong>{teamName}</strong> requires annual acknowledgment of the U.S.
        Center for SafeSport Minor Athlete Abuse Prevention Policies (MAAPP) for{" "}
        <strong>{swimmerName}</strong>.
      </Text>
      <Text style={textStyle}>
        Please review and acknowledge the policy:{" "}
        <a href={acknowledgeUrl}>{acknowledgeUrl}</a>
      </Text>
    </EmailLayout>
  );
}
