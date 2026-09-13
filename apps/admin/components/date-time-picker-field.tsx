"use client";

import {
  formatDateTimeLocalLabel as formatDateTimeLabel,
  formatDateTimeLocal,
  parseDateTimeLocal,
  toDateTimeLocalValue,
} from "@project-aqua/swim-core/calendar-date";
import { Button } from "@project-aqua/ui/components/button";
import { Calendar } from "@project-aqua/ui/components/calendar";
import { Field, FieldLabel } from "@project-aqua/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@project-aqua/ui/components/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@project-aqua/ui/components/popover";
import { cn } from "@project-aqua/ui/lib/utils";
import { CalendarIcon, Clock2Icon } from "lucide-react";
import { useId, useState } from "react";

/** `datetime-local`-compatible value: `YYYY-MM-DDTHH:mm`. */
export type DateTimeLocalValue = string;

export { toDateTimeLocalValue };

export function DateTimePickerField({
  id,
  value,
  onChange,
  placeholder = "Pick date & time",
  allowClear = false,
  defaultTime = "09:00",
  disabled,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: DateTimeLocalValue;
  onChange: (value: DateTimeLocalValue) => void;
  placeholder?: string;
  allowClear?: boolean;
  /** Used when a date is chosen and no time is set yet. */
  defaultTime?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const generatedId = useId();
  const timeId = id ? `${id}-time` : `${generatedId}-time`;
  const [open, setOpen] = useState(false);
  const { date: selectedDate, time } = parseDateTimeLocal(value);
  const label = formatDateTimeLabel(value);
  const timeValue = time || defaultTime;

  function commit(nextDate: Date | undefined, nextTime: string) {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(formatDateTimeLocal(nextDate, nextTime || defaultTime));
  }

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
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            commit(date, time || defaultTime);
          }}
          captionLayout="dropdown"
          className="p-0"
        />
        <div className="border-t bg-card p-3">
          <Field>
            <FieldLabel htmlFor={timeId}>Time</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id={timeId}
                type="time"
                step={60}
                value={selectedDate ? timeValue : ""}
                disabled={!selectedDate}
                onChange={(event) => {
                  if (!selectedDate) return;
                  commit(selectedDate, event.target.value.slice(0, 5));
                }}
                className="[&::-webkit-calendar-picker-indicator]:hidden"
              />
              <InputGroupAddon align="inline-end">
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          {allowClear && value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
