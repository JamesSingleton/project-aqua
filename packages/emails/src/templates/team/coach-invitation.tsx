import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface CoachInvitationProps {
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  role: string;
}

export default function CoachInvitation({
  inviterName,
  teamName,
  inviteUrl,
  role,
}: CoachInvitationProps) {
  return (
    <EmailLayout
      preview={`Join ${teamName} on Project Aqua`}
      heading="You've been invited!"
    >
      <Text style={textStyle}>
        {inviterName} invited you to join <strong>{teamName}</strong> as{" "}
        <strong>{role}</strong>.
      </Text>
      <EmailButton href={inviteUrl}>Accept invitation</EmailButton>
      <Text style={textStyle}>This invitation expires in 7 days.</Text>
    </EmailLayout>
  );
}

CoachInvitation.PreviewProps = {
  inviterName: "Coach Jane",
  teamName: "FAST Swim Club",
  inviteUrl: "https://app.projectaqua.com/accept-invite?id=abc",
  role: "assistant coach",
} satisfies CoachInvitationProps;
