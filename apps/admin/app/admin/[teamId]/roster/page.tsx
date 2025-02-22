import Link from "next/link";
import { FileIcon, UserPlusIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/ui/card";
import { Button, buttonVariants } from "@repo/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@repo/ui/table";
import AthleteInfo from "@/components/roster/athlete-info";
import { mockAthleteData } from "@/lib/mock-data";
// import { columns } from "@/components/roster/columns";
import { DataTable } from "@/components/roster/data-table";

import { Athlete } from "@/types";
import type { Metadata, ResolvingMetadata } from "next";
import { SwimmerButtons } from "./_components/swimmer-buttonts";
import { UsersTable } from "./_components/users-table";
import { columns } from "./_components/user-columns";
import { userListSchema, swimmerListSchema } from "@/data/schema";
import { users, swimmers } from "@/data/users";
import UsersProvider from "@/lib/users-context";

async function getData({ teamId }: { teamId: string }): Promise<Athlete[]> {
  return mockAthleteData;
}

export async function generateMetadata(
  {
    params,
    searchParams,
  }: {
    params: Promise<{ teamId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { teamId } = await params;

  return {
    title: "Manager Your Roster",
    alternates: {
      canonical: `/admin/${teamId}/roster`,
    },
    description:
      "View and manage your swim team's roster. Add, edit, and remove swimmers as needed.",
    openGraph: {
      title: "Manage Your Roster",
      description:
        "View and manage your swim team's roster. Add, edit, and remove swimmers as needed.",
      type: "website",
      url: `/admin/${teamId}/roster`,
      siteName: "Project Aqua",
    },
  };
}

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { teamId } = await params;
  const rosterData = await getData({ teamId });
  const userList = userListSchema.parse(users);
  const swimmerList = swimmerListSchema.parse(swimmers);

  return (
    <UsersProvider>
      <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User List</h2>
          <p className="text-muted-foreground">
            Manage your users and their roles here.
          </p>
        </div>
        <SwimmerButtons />
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-grow lg:space-x-12 lg:space-y-0">
        <UsersTable columns={columns} data={swimmerList} />
      </div>
    </UsersProvider>
  );
}
