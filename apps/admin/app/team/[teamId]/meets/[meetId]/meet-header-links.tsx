"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MeetHeaderLinks({
  teamId,
  meetId,
}: {
  teamId: string;
  meetId: string;
}) {
  const pathname = usePathname();
  const resultsHref = `/team/${teamId}/meets/${meetId}/results`;
  const onResults = pathname.startsWith(resultsHref);

  if (onResults) {
    return (
      <Link
        href={`/team/${teamId}/meets/${meetId}/entries`}
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
      >
        View entries
      </Link>
    );
  }

  return (
    <Link
      href={resultsHref}
      className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
    >
      View results
    </Link>
  );
}
