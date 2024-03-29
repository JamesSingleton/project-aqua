import Link from "next/link";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { Button, buttonVariants } from "@repo/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

async function getWorkouts() {
  return [
    {
      id: "ad054b8a-6c28-4b4f-99f8-2dd1608f8bfc",
      title: "Morning Practice - Freestyle Focus",
      description:
        "A morning practice focusing on freestyle technique and endurance.",
      date: "2024-03-25",
      sets: [
        {
          name: "Warm-Up",
          description:
            "400m Freestyle easy, 200m Kick with board, 200m Pull with buoy",
          distance: 800,
          distanceUnit: "meters",
          repetitions: 1,
        },
        {
          name: "Main Set 1",
          description: "5 x 200m Freestyle @70% effort with 30s rest",
          distance: 1000,
          distanceUnit: "meters",
          repetitions: 5,
        },
        {
          name: "Main Set 2",
          description: "4 x 100m Butterfly @80% effort with 20s rest",
          distance: 400,
          distanceUnit: "meters",
          repetitions: 4,
        },
        {
          name: "Cool-Down",
          description:
            "200m Freestyle easy, 100m Backstroke easy, 100m Breaststroke easy",
          distance: 400,
          distanceUnit: "meters",
          repetitions: 1,
        },
      ],
      totalDistance: 2600,
      distanceUnit: "meters",
      coachNotes:
        "Focus on maintaining proper form throughout each set. Push yourself, but don't sacrifice technique.",
      createdBy: "JohnDoe",
      createdAt: "2024-03-24T08:00:00Z",
    },
    {
      id: "5fd5a994-8480-4bfa-baf1-cf03e9267df8",
      title: "Afternoon Practice - IM Focus",
      description:
        "An afternoon practice focusing on Individual Medley (IM) strokes and transitions.",
      date: "2024-03-25",
      sets: [
        {
          name: "Warm-Up",
          description:
            "300m Individual Medley (IM) order, 200m Kick with fins, 200m Pull with paddles",
          distance: 700,
          distanceUnit: "meters",
          repetitions: 1,
        },
        {
          name: "Main Set 1",
          description: "4 x 100m Butterfly @80% effort with 20s rest",
          distance: 400,
          distanceUnit: "meters",
          repetitions: 4,
        },
        {
          name: "Main Set 2",
          description: "4 x 100m Backstroke @80% effort with 20s rest",
          distance: 400,
          distanceUnit: "meters",
          repetitions: 4,
        },
        {
          name: "Cool-Down",
          description:
            "200m Freestyle easy, 100m Breaststroke easy, 100m Backstroke easy",
          distance: 400,
          distanceUnit: "meters",
          repetitions: 1,
        },
      ],
      totalDistance: 1900,
      distanceUnit: "meters",
      coachNotes:
        "Focus on smooth transitions between strokes during the IM sets. Pay attention to streamline and efficient turns.",
      createdBy: "JaneDoe",
      createdAt: "2024-03-24T12:00:00Z",
    },
    {
      id: "fef0eeab-f04a-4b4d-a75c-af4d2351e77a",
      title: "Evening Practice - Sprint Focus",
      description: "An evening practice focusing on sprint techniques.",
      date: "2024-03-25",
      sets: [
        {
          name: "Warm-Up",
          description:
            "200yd Freestyle easy, 100yd Kick with board, 100yd Pull with buoy",
          distance: 400,
          distanceUnit: "yards",
          repetitions: 1,
        },
        {
          name: "Main Set",
          description: "8 x 50yd Freestyle @90% effort with 20s rest",
          distance: 400,
          distanceUnit: "yards",
          repetitions: 8,
        },
        {
          name: "Cool-Down",
          description:
            "100yd Freestyle easy, 50yd Backstroke easy, 50yd Breaststroke easy",
          distance: 200,
          distanceUnit: "yards",
          repetitions: 1,
        },
      ],
      totalDistance: 1000,
      distanceUnit: "yards",
      coachNotes:
        "Focus on explosive starts and maintaining maximum speed throughout each sprint interval. Pay attention to your stroke technique and make every stroke count.",
      createdBy: "CoachSmith",
      createdAt: "2024-03-24T17:00:00Z",
    },
  ];
}

export default async function WorkoutsPage() {
  const workouts = await getWorkouts();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Workouts</h1>
        <Link className={buttonVariants()} href="/admin/workouts/create">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Workout
        </Link>
      </div>
      {workouts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no workouts
            </h3>
            <p className="text-sm text-muted-foreground">
              Start adding workouts to keep track of them.
            </p>
            <Link
              className={cn(buttonVariants(), "mt-4")}
              href="/admin/workouts/create"
            >
              Add Workout
            </Link>
          </div>
        </div>
      ) : (
        <div className="border shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workout</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Distance</TableHead>
                <TableHead className="hidden md:table-cell">
                  No. of Sets
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workouts.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell className="font-medium">
                    <div>
                      {workout.title}
                      <p className="text-sm hidden md:block text-muted-foreground">
                        {workout.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{workout.date}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {workout.totalDistance}
                    {workout.distanceUnit === "meters" ? "m" : "yd"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {workout.sets.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontalIcon className="w-4 h-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/workouts/${workout.id}`}>
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/workouts/${workout.id}/edit`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
