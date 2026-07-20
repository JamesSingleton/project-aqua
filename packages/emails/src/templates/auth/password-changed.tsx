import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface PasswordChangedProps {
  name: string;
}

export default function PasswordChanged({ name }: PasswordChangedProps) {
  return (
    <EmailLayout preview="Your password was changed" heading="Password changed">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Your Project Aqua password was successfully changed. If you didn&apos;t
        make this change, contact support immediately.
      </Text>
    </EmailLayout>
  );
}

PasswordChanged.PreviewProps = {
  name: "Coach Jane",
} satisfies PasswordChangedProps;
