"use client";

import {
  formatLocalDateOnly as formatLocalDate,
  formatLocalDateOnlyLabel as formatLocalDateLabel,
  parseLocalDateOnly as parseLocalDate,
} from "@project-aqua/swim-core/calendar-date";
import { Button } from "@project-aqua/ui/components/button";
import { Calendar } from "@project-aqua/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
import { cn } from "@project-aqua/ui/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

export function DatePickerField({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  allowClear = false,
  disableFuture = false,
  disabled,
  labelMonth = "short",
  startMonth,
  endMonth,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Show a Clear action for optional dates (e.g. meet end date). */
  allowClear?: boolean;
  /** Disallow selecting dates after today (e.g. date of birth). */
  disableFuture?: boolean;
  disabled?: boolean;
  labelMonth?: "short" | "long";
  startMonth?: Date;
  endMonth?: Date;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseLocalDate(value);
  const label = formatLocalDateLabel(value, labelMonth);
  const today = new Date();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {label ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate ?? startMonth}
          onSelect={(date) => {
            onChange(date ? formatLocalDate(date) : "");
            setOpen(false);
          }}
          disabled={disableFuture ? { after: today } : undefined}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth ?? (disableFuture ? today : undefined)}
        />
        {allowClear && value ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
