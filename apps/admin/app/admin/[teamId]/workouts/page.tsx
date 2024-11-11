export default async function WorkoutsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl">Workouts</h1>
    </>
  );
}
