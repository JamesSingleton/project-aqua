import { getSwimmerById } from "@project-aqua/db/queries/roster";
import { notFound } from "next/navigation";
import { SetBreadcrumbEntity } from "@/components/breadcrumb-entities";

export default async function SwimmerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const swimmer = await getSwimmerById(swimmerId, teamId);
  if (!swimmer) notFound();

  const label =
    swimmer.preferredName?.trim() ||
    `${swimmer.firstName} ${swimmer.lastName}`.trim();

  return (
    <>
      <SetBreadcrumbEntity id={swimmerId} label={label} />
      {children}
    </>
  );
}
