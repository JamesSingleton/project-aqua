import Link from "next/link";
import { buttonVariants } from "@repo/ui/button";

export function CTA() {
  return (
    <div className="border border-border rounded-2xl md:container text-center px-10 py-14 mx-4 md:mx-auto md:px-24 md:py-20 mb-32 mt-24 flex items-center flex-col bg-accent">
      <span className="text-6xl	md:text-8xl font-medium text-primary">
        Effortless Team Management with Project Aqua.
      </span>
      <p className="text-muted-foreground mt-6">
        Simplify swim team management with Project Aqua's user-friendly
        platform. Spend less time on admin tasks and more time coaching your
        team to greatness.
      </p>

      <div className="mt-10 md:mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/talk-to-us"
            className={buttonVariants({ variant: "outline" })}
          >
            Talk to us
          </Link>

          <Link
            href="https://project-aqua-admin.vercel.app"
            className={buttonVariants()}
            target="_blank"
            rel="noreferrer noopener"
          >
            Get Early Access
          </Link>
        </div>
      </div>
    </div>
  );
}
