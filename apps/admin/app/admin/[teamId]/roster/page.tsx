import Link from "next/link";
import {
  ListFilterIcon,
  FileIcon,
  UserPlusIcon,
  MoreVerticalIcon,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@repo/ui/dropdown-menu";
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
import { columns } from "@/components/roster/columns";
import { DataTable } from "@/components/roster/data-table";

export default function RosterPage({
  params,
  searchParams,
}: {
  params: { teamId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { teamId } = params;
  const { athleteId } = searchParams;
  const selectedAthlete = mockAthleteData.find(
    (athlete) => athlete.id === athleteId,
  );
  const maleAthletes = mockAthleteData.filter(
    (athlete) => athlete.gender === "Male",
  );

  const femaleAthletes = mockAthleteData.filter(
    (athlete) => athlete.gender === "Female",
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Roster</h1>
      </div>
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Your Swim Team</CardTitle>
                <CardDescription className="max-w-lg text-balance leading-relaxed">
                  Manage your swim team's performance and progress.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link
                  href={`/admin/${teamId}/athletes/create`}
                  className={buttonVariants()}
                >
                  <UserPlusIcon className="h-4 w-4" />
                  <span className="ml-2">Add Swimmer</span>
                </Link>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Swimmers</CardDescription>
                <CardTitle className="text-3xl">
                  {mockAthleteData.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="text-xs text-muted-foreground">
                    Male Swimmers: {maleAthletes.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Female Swimmers: {femaleAthletes.length}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-3xl">80 Practices</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <Tabs defaultValue="swimmers">
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="swimmers">Swimmers</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="h-7 gap-1 text-sm"
                      size="sm"
                      variant="outline"
                    >
                      <ListFilterIcon className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only">Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                      Attended
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Missed</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>Excused</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  className="h-7 gap-1 text-sm"
                  size="sm"
                  variant="outline"
                >
                  <FileIcon className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Export</span>
                </Button>
              </div>
            </div>
            <TabsContent value="swimmers">
              <Card>
                <CardHeader className="px-7">
                  <CardTitle>Roster</CardTitle>
                  <CardDescription>
                    View and manage your swim team's roster.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable columns={columns} data={mockAthleteData} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="staff">
              <Card>
                <CardHeader className="px-7">
                  <CardTitle>Staff</CardTitle>
                  <CardDescription>
                    View and manage your swim team's staff.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Role
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Email
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Phone
                        </TableHead>
                        {/* a table head that a switch would be useful for */}
                        <TableHead className="hidden md:table-cell">
                          Admin
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Jane Doe</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          Coach
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          janedoe@example.com
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          555-555-5555
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div>
          {selectedAthlete && <AthleteInfo athlete={selectedAthlete} />}
        </div>
      </div>
    </>
  );
}
