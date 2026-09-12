import { Text } from "react-email";
import { EmailButton, EmailLayout, textStyle } from "../_layout";

export interface SubscriptionConfirmedProps {
  name: string;
  teamName: string;
  plan: string;
  billingUrl: string;
}

export default function SubscriptionConfirmed({
  name,
  teamName,
  plan,
  billingUrl,
}: SubscriptionConfirmedProps) {
  return (
    <EmailLayout
      preview={`${teamName} upgraded to ${plan}`}
      heading="Subscription confirmed"
    >
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        <strong>{teamName}</strong> has been upgraded to the{" "}
        <strong>{plan}</strong> plan. Thank you for your subscription!
      </Text>
      <EmailButton href={billingUrl}>Manage billing</EmailButton>
    </EmailLayout>
  );
}
