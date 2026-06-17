import CreateSwimmerForm from "@/app/team/[teamId]/swimmers/create/create-swimmer-form";
import { Modal } from "./modal";

export default async function AthleteModal({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <Modal>
      <div className="bg-background fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border p-6 shadow-lg">
          <CreateSwimmerForm teamId={teamId} />
        </div>
      </div>
    </Modal>
  );
}
