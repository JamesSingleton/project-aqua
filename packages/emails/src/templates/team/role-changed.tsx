import { Text } from "@react-email/components";
import { EmailLayout, textStyle } from "../_layout.js";

export interface RoleChangedProps {
  name: string;
  teamName: string;
  newRole: string;
}

export default function RoleChanged({
  name,
  teamName,
  newRole,
}: RoleChangedProps) {
  return (
    <EmailLayout preview="Your role was updated" heading="Role updated">
      <Text style={textStyle}>Hi {name},</Text>
      <Text style={textStyle}>
        Your role on <strong>{teamName}</strong> has been updated to{" "}
        <strong>{newRole}</strong>.
      </Text>
    </EmailLayout>
  );
}
