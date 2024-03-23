import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TeamsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Teams</h1>
        <Link className={buttonVariants()} href="/admin/teams/create">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Team
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            You have no teams
          </h3>
          <p className="text-sm text-muted-foreground">
            You can start adding swimmers as soon as you add a team.
          </p>
          <Link
            className={cn(buttonVariants(), "mt-4")}
            href="/admin/teams/create"
          >
            Add Team
          </Link>
        </div>
      </div>
    </>
  );
}
