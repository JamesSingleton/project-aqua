import { Separator } from "@project-aqua/ui/components/separator";
import { cn } from "@project-aqua/ui/lib/utils";

export function SettingsSection({
  title,
  description,
  children,
  className,
  showSeparator = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showSeparator?: boolean;
}) {
  return (
    <>
      {showSeparator ? <Separator className="my-10" /> : null}
      <section
        className={cn("grid grid-cols-1 gap-10 py-3 lg:grid-cols-3", className)}
      >
        <div className="flex flex-col space-y-1">
          <h3 className="font-semibold">{title}</h3>
          {description ? (
            <p className="text-muted-foreground text-sm text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        <div className="lg:col-span-2">{children}</div>
      </section>
    </>
  );
}
