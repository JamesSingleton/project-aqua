import { buttonVariants } from "@project-aqua/design-system/components/button";
import Link from "next/link";

export function CTA() {
  return (
    <div className="mx-4 mt-24 mb-32 flex flex-col items-center rounded-2xl border border-border bg-accent px-10 py-14 text-center md:container md:mx-auto md:px-24 md:py-20">
      <span className="font-medium text-6xl text-primary md:text-8xl">
        Effortless Team Management with Project Aqua.
      </span>
      <p className="mt-6 text-muted-foreground">
        Simplify swim team management with Project Aqua&apos;s user-friendly
        platform. Spend less time on admin tasks and more time coaching your
        team to greatness.
      </p>

      <div className="mt-10 md:mb-8">
        <div className="flex items-center space-x-4">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/talk-to-us"
          >
            Talk to us
          </Link>

          <Link
            className={buttonVariants()}
            href="https://project-aqua-admin.vercel.app"
            rel="noreferrer noopener"
            target="_blank"
          >
            Get Early Access
          </Link>
        </div>
      </div>
    </div>
  );
}
