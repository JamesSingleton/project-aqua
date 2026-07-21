import { Avatar, AvatarFallback } from "@project-aqua/ui/components/avatar";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { cn } from "@project-aqua/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function StatCard({
  title,
  value,
  meta,
  delta,
  deltaPositive,
  href,
  linkLabel,
  icon: Icon,
  iconClassName,
  iconBgClassName,
}: {
  title: string;
  value: string;
  meta?: string;
  delta?: string;
  deltaPositive?: boolean;
  href: string;
  linkLabel: string;
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
}) {
  return (
    <Card size="sm" className="h-full gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-timing text-3xl tabular-nums">
          {value}
        </CardTitle>
        <CardAction>
          <Avatar className="size-10 rounded-sm after:border-0">
            <AvatarFallback
              className={cn("rounded-sm", iconBgClassName ?? "bg-primary/10")}
            >
              <Icon className={cn("size-5", iconClassName ?? "text-primary")} />
            </AvatarFallback>
          </Avatar>
        </CardAction>
      </CardHeader>
      <CardFooter className="mt-auto justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {delta ? (
            <span
              className={cn(
                "text-xs font-medium",
                deltaPositive === false
                  ? "text-destructive"
                  : "text-emerald-600",
              )}
            >
              {deltaPositive === false ? "↓" : "↑"} {delta}
            </span>
          ) : null}
          {meta ? (
            <span className="text-muted-foreground truncate text-xs">
              {meta}
            </span>
          ) : null}
        </div>
        <Button
          size="xs"
          variant="ghost"
          nativeButton={false}
          render={<Link href={href} />}
        >
          {linkLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
