import Link from "next/link";
import { Button, buttonVariants } from "@project-aqua/ui/components/button";

export function Hero() {
  return (
    <section className="text-center mt-16 md:mt-18 items-center flex flex-col">
      <Link href="/updates/early-adopter">
        <Button
          variant="outline"
          className="rounded-full border-border flex space-x-2 items-center"
        >
          <span>Announcing Early Adopters Plan</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={12}
            height={12}
            fill="none"
          >
            <path
              fill="currentColor"
              d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
            />
          </svg>
        </Button>
      </Link>

      <h1 className="text-6xl font-medium mt-6">
        Manage Your Swim Team Effortlessly
      </h1>

      <p className="mt-4 md:mt-6 text-muted-foreground max-w-[600px]">
        Project Aqua provides you with greater insight into your team and
        automates the boring tasks, allowing you to focus on what you love to do
        instead.
      </p>

      <div className="mt-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/talk-to-us"
            className={buttonVariants({ variant: "outline" })}
          >
            Talk to us
          </Link>

          <a
            href="https://project-aqua-admin.vercel.app"
            className={buttonVariants()}
          >
            Get Early Access
          </a>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        No credit card required.
      </p>
    </section>
  );
}
