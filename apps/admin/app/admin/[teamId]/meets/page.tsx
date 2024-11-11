import { Button } from "@repo/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";

export default async function MeetsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Swim Meets</h1>
        <Button className="ml-auto" size="sm">
          Add Meet
        </Button>
      </div>
      <div className="border shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meet Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                Regional Championships
              </TableCell>
              <TableCell>June 15, 2023</TableCell>
              <TableCell>Olympia Aquatic Center</TableCell>
              <TableCell>
                <Badge>Completed</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Summer Invitational</TableCell>
              <TableCell>July 20, 2023</TableCell>
              <TableCell>Riverside Swim Club</TableCell>
              <TableCell>
                <Badge>Registered</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Fall Championships</TableCell>
              <TableCell>September 5, 2023</TableCell>
              <TableCell>Aquatic Center of Excellence</TableCell>
              <TableCell>
                <Badge variant="destructive">Cancelled</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Winter Classic</TableCell>
              <TableCell>December 10, 2023</TableCell>
              <TableCell>Northside Swim Center</TableCell>
              <TableCell>
                <Badge>Registered</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">
                  View
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Upcoming Meets</CardTitle>
            <CardDescription>
              Meets that are scheduled in the near future.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Summer Invitational</div>
                <Badge>Registered</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                July 20, 2023 - Riverside Swim Club
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Prepare for the big event!
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Winter Classic</div>
                <Badge>Registered</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                December 10, 2023 - Northside Swim Center
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Get ready for the winter season!
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Past Meets</CardTitle>
            <CardDescription>
              Meets that have already taken place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Regional Championships</div>
                <Badge>Completed</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                June 15, 2023 - Olympia Aquatic Center
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Great performance by the team!
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Fall Championships</div>
                <Badge variant="destructive">Cancelled</Badge>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                September 5, 2023 - Aquatic Center of Excellence
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Unfortunate cancellation due to weather.
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter swim meets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input id="search" placeholder="Search meets..." type="text" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="all">
                  <option value="all">All</option>
                  <option value="registered">Registered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
              </div>
              <Button className="w-full">Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
