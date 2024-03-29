import Link from "next/link";
import { Users, ArrowUpRight, Calendar, Trophy, Waves } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@repo/ui/card";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@repo/ui/table";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Swimmers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">+12 from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Next: City Championship
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Record Breakers
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              New records this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pool Usage</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">
              Average daily occupancy
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>
                Celebrating recent wins and records.
              </CardDescription>
            </div>
            <Link
              href="/admin/achievements"
              className={cn(buttonVariants({ size: "sm" }), "ml-auto gap-1")}
            >
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Swimmer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Emily Clark</TableCell>
                  <TableCell>100m Freestyle</TableCell>
                  <TableCell>00:55:30</TableCell>
                  <TableCell>2023-07-15</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Michael Brown</TableCell>
                  <TableCell>200m Butterfly</TableCell>
                  <TableCell>02:05:12</TableCell>
                  <TableCell>2023-07-18</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sophia Miller</TableCell>
                  <TableCell>50m Backstroke</TableCell>
                  <TableCell>00:29:10</TableCell>
                  <TableCell>2023-07-22</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Emily Clark</TableCell>
                  <TableCell>100m Freestyle</TableCell>
                  <TableCell>00:55:30</TableCell>
                  <TableCell>2023-07-15</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Michael Brown</TableCell>
                  <TableCell>200m Butterfly</TableCell>
                  <TableCell>02:05:12</TableCell>
                  <TableCell>2023-07-18</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Sophia Miller</TableCell>
                  <TableCell>50m Backstroke</TableCell>
                  <TableCell>00:29:10</TableCell>
                  <TableCell>2023-07-22</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Swimmers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Olivia Martin
                </p>
                <p className="text-sm text-muted-foreground">
                  olivia.martin@email.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback>JL</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Jackson Lee</p>
                <p className="text-sm text-muted-foreground">
                  jackson.lee@email.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback>IN</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  Isabella Nguyen
                </p>
                <p className="text-sm text-muted-foreground">
                  isabella.nguyen@email.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback>WK</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">William Kim</p>
                <p className="text-sm text-muted-foreground">will@email.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                <AvatarFallback>SD</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Sofia Davis</p>
                <p className="text-sm text-muted-foreground">
                  sofia.davis@email.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Upcoming Swim Meets</CardTitle>
              <CardDescription>A list of upcoming events</CardDescription>
            </div>
            <Link
              href="/admin/events"
              className={cn(buttonVariants({ size: "sm" }), "ml-auto gap-1")}
            >
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered Swimmers</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Regional Qualifiers</TableCell>
                  <TableCell>Lake Tahoe</TableCell>
                  <TableCell>42</TableCell>
                  <TableCell>August 15, 2023</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Open Water Challenge</TableCell>
                  <TableCell>San Francisco Bay</TableCell>
                  <TableCell>37</TableCell>
                  <TableCell>September 5, 2023</TableCell>
                  <TableCell>No</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>National Championships</TableCell>
                  <TableCell>Clearwater Beach</TableCell>
                  <TableCell>58</TableCell>
                  <TableCell>October 20, 2023</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card> */}
      </div>
    </>
  );
}
