"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { CopyIcon, MoreVerticalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";

import { DataTableColumnHeader } from "../data-table-column-header";

import type { Athlete } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/sheet";
import { Separator } from "@repo/ui/separator";
import { ScrollArea } from "@repo/ui/scroll-area";

export const columns: ColumnDef<Athlete>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "gender",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gender" />
    ),
    cell: ({ row }) => {
      return (
        <span title={row.original.gender}>
          {row.original.gender === "Male" ? "M" : "F"}
        </span>
      );
    },
  },
  {
    accessorKey: "birthday",
    header: "Birthday",
    cell: ({ row }) => {
      return new Date(row.original.dateOfBirth).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
  {
    accessorKey: "age",
    header: "Age",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const athlete = row.original;
      const params = useParams();
      const [isMenuOpen, setIsMenuOpen] = useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(athlete.id)}
              >
                Copy Swimmer's ID
              </DropdownMenuItem>
              <DropdownMenuItem>Mark as Inactive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/${params.teamId}/roster?athleteId=${athlete.id}`}
                  onClick={() => setIsMenuOpen(true)}
                >
                  Quick View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/${params.teamId}/athletes/${athlete.id}/edit`}
                >
                  Edit
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetContent className="sm:max-w-md">
              <SheetHeader className="flex flex-col space-y-2 text-left">
                <SheetTitle className="font-semibold tracking-tight group flex items-center gap-2 text-lg">
                  {athlete.name}
                  <span className="text-sm text-gray-500">
                    (ID: {athlete.id})
                  </span>
                  <Button
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    size="icon"
                    variant="outline"
                    title="Copy Swimmer ID"
                    onClick={() => navigator.clipboard.writeText(athlete.id)}
                  >
                    <CopyIcon className="h-3 w-3" />
                    <span className="sr-only">Copy Swimmer ID</span>
                  </Button>
                </SheetTitle>
                <SheetDescription>
                  Date of Birth:{" "}
                  {new Date(athlete.dateOfBirth).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
              <ScrollArea className="h-[calc(100vh-8rem)] pr-3 pb-10">
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
                      <span className="text-muted-foreground">
                        Practice Group
                      </span>
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
                        <span className="text-muted-foreground">
                          {record.event}
                        </span>
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
                      <div className="font-semibold">
                        Emergency Contact Information
                      </div>
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
                              <dt className="text-muted-foreground">
                                Relationship
                              </dt>
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
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
