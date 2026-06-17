import { Text } from "@react-email/components";
import { EmailButton, EmailLayout, textStyle } from "../_layout.js";

export interface ResetPasswordProps {
  name: string;
  url: string;
}

export default function ResetPassword({ name, url }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your password" heading="Reset your password">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        We received a request to reset your password. Click the button below to
        choose a new password.
      </Text>
      <EmailButton href={url}>Reset password</EmailButton>
      <Text style={textStyle}>
        This link expires in 1 hour. If you didn&apos;t request this, ignore
        this email.
      </Text>
    </EmailLayout>
  );
}

ResetPassword.PreviewProps = {
  name: "Coach Jane",
  url: "https://app.projectaqua.com/reset?token=abc",
} satisfies ResetPasswordProps;
