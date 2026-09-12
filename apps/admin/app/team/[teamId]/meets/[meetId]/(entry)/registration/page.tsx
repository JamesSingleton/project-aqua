import { redirect } from "next/navigation";

export default async function MeetRegistrationRedirect({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  redirect(`/team/${teamId}/meets/${meetId}/entries`);
}
