import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function TeamsPage() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold sm:text-xl md:text-2xl lg:text-4xl">
          Teams
        </h1>
        <Link className={buttonVariants()} href="/admin/teams/create">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Team
        </Link>
      </div>
    </>
  );
}
