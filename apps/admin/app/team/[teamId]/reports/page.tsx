export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <>
      <h1 className="text-lg font-semibold md:text-2xl">Reports</h1>
    </>
  );
}
