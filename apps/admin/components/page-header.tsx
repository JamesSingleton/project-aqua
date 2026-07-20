import { cn } from "@project-aqua/ui/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-pool-deep md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
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
