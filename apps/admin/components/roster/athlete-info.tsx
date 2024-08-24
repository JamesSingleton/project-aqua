"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CopyIcon,
  MoreVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@repo/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@repo/ui/dropdown-menu";

import type { Athlete } from "@/types";

type AthleteInfoProps = {
  athlete: Athlete;
};

export default function AthleteInfo({ athlete }: AthleteInfoProps) {
  const params = useParams();
  const { teamId } = params;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-xl">
            {athlete.name}
            <span className="text-lg text-gray-500">(ID: {athlete.id})</span>
            <Button
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              size="icon"
              variant="outline"
              title="Copy Swimmer ID"
            >
              <CopyIcon className="h-3 w-3" />
              <span className="sr-only">Copy Swimmer ID</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Date of Birth:{" "}
            {new Date(athlete.dateOfBirth).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8" size="icon" variant="outline">
                <MoreVerticalIcon className="h-3.5 w-3.5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/${teamId}/swimmers/${athlete.id}`}>
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/${teamId}/swimmers/${athlete.id}/edit`}>
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Remove</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Swimmer Details</div>
          <ul className="grid gap-3">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Age</span>
              <span>{athlete.age}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Coach</span>
              <span>Coach O'Brien</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Practice Group</span>
              <span>{athlete.practiceGroup}</span>
            </li>
          </ul>
          <Separator className="my-2" />
          <div className="font-semibold">Personal Records</div>
          <ul className="grid gap-3">
            {athlete.personalRecords.map((record) => (
              <li
                key={record.event}
                className="flex items-center justify-between"
              >
                <span className="text-muted-foreground">{record.event}</span>
                <span>{record.time}</span>
              </li>
            ))}
          </ul>
        </div>
        {athlete.parents.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Parent Information</div>
              <dl className="grid gap-3">
                {athlete.parents.map((parent) => (
                  <div key={parent.name} className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd>{parent.name}</dd>
                    </div>
                    {parent.email && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>
                          <Link href={`mailto:${parent.email}`}>
                            {parent.email}
                          </Link>
                        </dd>
                      </div>
                    )}
                    {parent.phone_number && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd>
                          <Link href={`tel:${parent.phone_number}`}>
                            {parent.phone_number}
                          </Link>
                        </dd>
                      </div>
                    )}
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
        {athlete.emergencyContacts.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="grid gap-3">
              <div className="font-semibold">Emergency Contact Information</div>
              <dl className="grid gap-3">
                {athlete.emergencyContacts.map((contact) => (
                  <div
                    className="grid gap-3"
                    key={`${contact.name}_${contact.phone_number}`}
                  >
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Contact</dt>
                      <dd>{contact.name}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Relationship</dt>
                      <dd>{contact.relationship}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>
                        <Link href={`tel:${contact.phone_number}`}>
                          {contact.phone_number}
                        </Link>
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Updated
          <time dateTime="2023-11-23" className="pl-1">
            November 23, 2023
          </time>
        </div>
        <Pagination className="ml-auto mr-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button className="h-6 w-6" size="icon" variant="outline">
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Previous Swimmer</span>
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button className="h-6 w-6" size="icon" variant="outline">
                <ChevronRightIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Next Swimmer</span>
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}
