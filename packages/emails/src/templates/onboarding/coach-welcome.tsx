import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface CoachWelcomeProps {
  name: string;
  dashboardUrl: string;
}

export default function CoachWelcome({
  name,
  dashboardUrl,
}: CoachWelcomeProps) {
  return (
    <EmailLayout preview="Welcome to Lane4 HQ" heading="Welcome, coach!">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Welcome to Lane4 HQ! You&apos;re all set to start managing your swim
        team.
      </Text>
      <Text style={textStyle}>Quick start:</Text>
      <Text style={textStyle}>1. Create or join a team</Text>
      <Text style={textStyle}>2. Add your roster</Text>
      <Text style={textStyle}>3. Set up your first practice</Text>
      <EmailButton href={dashboardUrl}>Go to dashboard</EmailButton>
    </EmailLayout>
  );
}

CoachWelcome.PreviewProps = {
  name: "Coach Jane",
  dashboardUrl: "https://admin.lane4hq.com/onboarding",
} satisfies CoachWelcomeProps;
