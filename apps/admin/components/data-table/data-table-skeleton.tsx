import { Skeleton } from "@project-aqua/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  filterCount?: number;
}

export function DataTableSkeleton({
  columnCount = 8,
  rowCount = 10,
  filterCount = 3,
}: DataTableSkeletonProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 overflow-auto">
      <div className="flex w-full items-center justify-between gap-2 p-1">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {Array.from({ length: filterCount }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-8 w-20 lg:flex" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
