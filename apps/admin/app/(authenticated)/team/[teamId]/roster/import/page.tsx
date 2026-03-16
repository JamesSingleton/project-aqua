import { Header } from "@/components/header";

export default async function ImportRosterPage({
  params
}: { params: Promise<{ teamid: string }> }) {
  const { teamId } = await params;

  return (
    <>
      <Header page="Roster Import" pages={["Roster"]} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 md:gap-6 md:px-6 md:pb-6">
        Import Roster
      </div>
    </>
  )
}
