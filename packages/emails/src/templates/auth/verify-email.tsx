import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface VerifyEmailProps {
  name: string;
  url: string;
}

export default function VerifyEmail({ name, url }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your email address"
      heading="Verify your email"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Thanks for signing up for Project Aqua. Please verify your email address
        to get started.
      </Text>
      <EmailButton href={url}>Verify email</EmailButton>
      <Text style={textStyle}>
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  name: "Coach Jane",
  url: "https://app.projectaqua.com/verify?token=abc",
} satisfies VerifyEmailProps;
