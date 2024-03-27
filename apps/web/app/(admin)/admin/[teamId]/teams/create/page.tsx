import CreateTeam from "@/components/forms/CreateTeam";

export default function CreateTeamPage() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Create Team</h1>
      </div>
      <div>
        <CreateTeam />
      </div>
    </>
  );
}
