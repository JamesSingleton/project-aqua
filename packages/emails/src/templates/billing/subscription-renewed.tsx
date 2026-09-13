import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface SubscriptionRenewedProps {
  name: string;
  teamName: string;
  plan: string;
}

export default function SubscriptionRenewed({
  name,
  teamName,
  plan,
}: SubscriptionRenewedProps) {
  return (
    <EmailLayout preview="Subscription renewed" heading="Subscription renewed">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Your <strong>{plan}</strong> subscription for{" "}
        <strong>{teamName}</strong> has been renewed successfully.
      </Text>
    </EmailLayout>
  );
}
