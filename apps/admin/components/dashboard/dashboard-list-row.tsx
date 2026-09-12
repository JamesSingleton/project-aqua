import Link from "next/link";

/** Fixed-height list row so schedule/workout columns stay aligned. */
export function DashboardListRow({
  href,
  title,
  meta,
  trailing,
}: {
  href: string;
  title: string;
  meta?: string | null;
  trailing?: string | null;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium leading-tight">{title}</span>
        {meta ? (
          <span className="truncate text-muted-foreground text-xs">{meta}</span>
        ) : null}
      </div>
      {trailing ? (
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {trailing}
        </span>
      ) : null}
    </Link>
  );
}
