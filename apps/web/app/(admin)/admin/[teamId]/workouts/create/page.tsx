import CreateWorkout from "@/components/forms/CreateWorkout";

export default function CreateWorkoutPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Create Workout</h1>
      </div>
      <div className="container">
        <CreateWorkout />
      </div>
    </>
  );
}
