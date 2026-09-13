import { Text } from "react-email";
import { EmailLayout, textStyle } from "../_layout";

export interface MemberJoinedProps {
  memberName: string;
  teamName: string;
}

export default function MemberJoined({
  memberName,
  teamName,
}: MemberJoinedProps) {
  return (
    <EmailLayout
      preview={`${memberName} joined ${teamName}`}
      heading="New team member"
    >
      <Text style={textStyle}>
        {memberName} has joined <strong>{teamName}</strong>.
      </Text>
    </EmailLayout>
  );
}
