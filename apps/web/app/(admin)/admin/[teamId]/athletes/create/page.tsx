import CreateAthlete from "@/components/forms/CreateAthlete";

export default function CreateAthletePage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Create Athlete</h1>
      </div>
      <div className="container">
        <CreateAthlete />
      </div>
    </>
  );
}
