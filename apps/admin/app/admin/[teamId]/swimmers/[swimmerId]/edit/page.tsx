export default async function EditAthlete({
  params,
}: {
  params: { teamId: string; athleteId: string };
}) {
  console.log({ teamId: params.teamId, athleteId: params.athleteId });
  return (
    <div>
      <h1>Edit Athlete</h1>
    </div>
  );
}
