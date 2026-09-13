import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface InvitationAcceptedProps {
  inviteeName: string;
  teamName: string;
}

export default function InvitationAccepted({
  inviteeName,
  teamName,
}: InvitationAcceptedProps) {
  return (
    <EmailLayout
      preview={`${inviteeName} joined ${teamName}`}
      heading="Invitation accepted"
    >
      <Text style={textStyle}>
        {inviteeName} has accepted your invitation and joined{" "}
        <strong>{teamName}</strong>.
      </Text>
    </EmailLayout>
  );
}
