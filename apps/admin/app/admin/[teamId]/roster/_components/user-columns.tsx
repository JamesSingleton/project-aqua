"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@repo/ui/badge";
import { Checkbox } from "@repo/ui/checkbox";

import { cn } from "@/lib/utils";
import LongText from "@/components/long-text";
import { callTypes, userTypes } from "@/data/data";
import { User } from "@/data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<User>[] = [
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
        className="translate-y-[2px]"
      />
    ),
    meta: {
      className: cn(
        "sticky md:table-cell left-0 z-10 rounded-tl",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-36">{row.getValue("lastName")}</LongText>
    ),
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
        "sticky left-6 md:table-cell"
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "gender",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gender" />
    ),
  },
  {
    accessorKey: "age",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Age" />
    ),
  },
  {
    accessorKey: "birthday",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Birthday" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "roster",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Roster" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="w-fit text-nowrap">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "memberType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Member Type" />
    ),
    cell: ({ row }) => <div>{row.getValue("memberType")}</div>,
    enableSorting: false,
  },
  // {
  //   accessorKey: "status",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Status" />
  //   ),
  //   cell: ({ row }) => {
  //     const { status } = row.original;
  //     const badgeColor = callTypes.get(status);
  //     return (
  //       <div className="flex space-x-2">
  //         <Badge variant="outline" className={cn("capitalize", badgeColor)}>
  //           {row.getValue("status")}
  //         </Badge>
  //       </div>
  //     );
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id));
  //   },
  //   enableHiding: false,
  //   enableSorting: false,
  // },
  // {
  //   accessorKey: "role",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Role" />
  //   ),
  //   cell: ({ row }) => {
  //     const { role } = row.original;
  //     const userType = userTypes.find(({ value }) => value === role);

  //     if (!userType) {
  //       return null;
  //     }

  //     return (
  //       <div className="flex items-center gap-x-2">
  //         {userType.icon && (
  //           <userType.icon size={16} className="text-muted-foreground" />
  //         )}
  //         <span className="text-sm capitalize">{row.getValue("role")}</span>
  //       </div>
  //     );
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id));
  //   },
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];
