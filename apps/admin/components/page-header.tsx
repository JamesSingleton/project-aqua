import { cn } from "@project-aqua/ui/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 w-full flex-1 flex-col gap-1">
        <h1 className="font-display text-pool-deep text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
          {title}
        </h1>
        {description ? (
          typeof description === "string" ? (
            <p className="text-muted-foreground max-w-2xl text-sm break-words">
              {description}
            </p>
          ) : (
            description
          )
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function TimingBoard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-primary text-primary-foreground rounded-md px-4 py-3">
      <p className="text-xs font-medium tracking-wide uppercase opacity-80">
        {label}
      </p>
      <p className="font-timing text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs opacity-75">{hint}</p> : null}
    </div>
  );
}
