export default async function EditAthlete({
  params,
}: {
  params: Promise<{ teamId: string; athleteId: string }>;
}) {
  const { teamId, athleteId } = await params;

  return (
    <div>
      <h1>Edit Athlete</h1>
    </div>
  );
}
