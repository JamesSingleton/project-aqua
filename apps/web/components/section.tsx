import { cn } from "@project-aqua/ui/lib/utils";

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-28",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageIntro({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Section className="pb-10 md:pb-12">
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-pretty md:text-6xl md:leading-[0.95]">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground text-pretty">
          {description}
        </p>
        {children}
      </div>
    </Section>
  );
}
