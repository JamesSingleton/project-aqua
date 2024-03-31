export default async function AthletePage({
  params,
}: {
  params: { teamId: string; athleteId: string };
}) {
  console.log({ teamId: params.teamId, athleteId: params.athleteId });
  return (
    <div>
      <h1>Athlete Page</h1>
    </div>
  );
}
