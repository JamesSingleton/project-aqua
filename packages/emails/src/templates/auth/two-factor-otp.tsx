import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface TwoFactorOtpProps {
  name: string;
  otp: string;
}

export default function TwoFactorOtp({ name, otp }: TwoFactorOtpProps) {
  return (
    <EmailLayout
      preview="Your sign-in verification code"
      heading="Sign-in verification code"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Use this one-time code to finish signing in to Project Aqua:
      </Text>
      <Text
        style={{
          ...textStyle,
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          fontFamily: "monospace",
        }}
      >
        {otp}
      </Text>
      <Text style={textStyle}>
        This code expires shortly. If you didn&apos;t try to sign in, you can
        ignore this email.
      </Text>
    </EmailLayout>
  );
}

TwoFactorOtp.PreviewProps = {
  name: "Coach Jane",
  otp: "123456",
} satisfies TwoFactorOtpProps;
