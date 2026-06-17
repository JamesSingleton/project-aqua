import CreateSwimmerForm from "./create-swimmer-form";

export default async function CreateSwimmerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add swimmer</h1>
      <CreateSwimmerForm teamId={teamId} />
    </div>
  );
}
