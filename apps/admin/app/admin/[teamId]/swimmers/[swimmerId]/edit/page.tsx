export default async function EditAthlete({
  params,
}: {
  params: Promise<{ teamId: string; athleteId: string }>;
}) {
  const { teamId, athleteId } = await params;
  console.log({ teamId: teamId, athleteId: athleteId });
  return (
    <div>
      <h1>Edit Athlete</h1>
    </div>
  );
}
