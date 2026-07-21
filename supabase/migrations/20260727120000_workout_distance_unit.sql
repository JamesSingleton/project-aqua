-- Practice volume unit (yards vs meters) per workout

CREATE TYPE "public"."workout_distance_unit" AS ENUM('yards', 'meters');

ALTER TABLE "workouts"
  ADD COLUMN "distance_unit" "workout_distance_unit";
