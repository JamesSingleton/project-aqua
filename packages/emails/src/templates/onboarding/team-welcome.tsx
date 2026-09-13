import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface TeamWelcomeProps {
  name: string;
  teamName: string;
  teamId: string;
  baseUrl: string;
}

export default function TeamWelcome({
  name,
  teamName,
  teamId,
  baseUrl,
}: TeamWelcomeProps) {
  const teamUrl = `${baseUrl}/team/${teamId}`;
  return (
    <EmailLayout preview={`${teamName} is ready`} heading="Your team is ready!">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        <strong>{teamName}</strong> has been created on the Free plan. You can
        now manage your roster, track attendance, and more.
      </Text>
      <Text style={textStyle}>Next steps:</Text>
      <Text style={textStyle}>• Import or add swimmers to your roster</Text>
      <Text style={textStyle}>• Connect your USA Swimming club (optional)</Text>
      <Text style={textStyle}>• Schedule your first practice</Text>
      <EmailButton href={teamUrl}>Open team dashboard</EmailButton>
    </EmailLayout>
  );
}

TeamWelcome.PreviewProps = {
  name: "Coach Jane",
  teamName: "FAST Swim Club",
  teamId: "team_123",
  baseUrl: "https://app.projectaqua.com",
} satisfies TeamWelcomeProps;
