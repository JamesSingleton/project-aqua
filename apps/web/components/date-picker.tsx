"use client";

import { Button } from "@project-aqua/design-system/components/button";
import { Calendar } from "@project-aqua/design-system/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/design-system/components/popover";
import { cn } from "@project-aqua/design-system/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

export function DatePicker() {
  const [date, setDate] = React.useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          variant={"outline"}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          initialFocus
          mode="single"
          onSelect={setDate}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  );
}
