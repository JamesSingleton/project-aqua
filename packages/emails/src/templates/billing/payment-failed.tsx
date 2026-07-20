import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface PaymentFailedProps {
  name: string;
  teamName: string;
  billingUrl: string;
}

export default function PaymentFailed({
  name,
  teamName,
  billingUrl,
}: PaymentFailedProps) {
  return (
    <EmailLayout preview="Payment failed" heading="Payment failed">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        We couldn&apos;t process the payment for <strong>{teamName}</strong>.
        Please update your payment method to avoid service interruption.
      </Text>
      <EmailButton href={billingUrl}>Update payment method</EmailButton>
    </EmailLayout>
  );
}
