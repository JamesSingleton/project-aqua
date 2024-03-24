import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function IndividualWorkoutPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">
          Individual Workout
        </h1>
        <Link
          className={buttonVariants()}
          href={`/admin/workouts/${params.id}/edit`}
        >
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Workout
        </Link>
      </div>
    </>
  );
}
