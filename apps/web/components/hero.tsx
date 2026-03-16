import {
  Button,
  buttonVariants,
} from "@project-aqua/design-system/components/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="mt-16 flex flex-col items-center text-center md:mt-18">
      <Link href="/updates/early-adopter">
        <Button
          className="flex items-center space-x-2 rounded-full border-border"
          variant="outline"
        >
          <span>Announcing Early Adopters Plan</span>
          <svg
            fill="none"
            height={12}
            width={12}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
              fill="currentColor"
            />
          </svg>
        </Button>
      </Link>

      <h1 className="mt-6 font-medium text-6xl">
        Manage Your Swim Team Effortlessly
      </h1>

      <p className="mt-4 max-w-[600px] text-muted-foreground md:mt-6">
        Project Aqua provides you with greater insight into your team and
        automates the boring tasks, allowing you to focus on what you love to do
        instead.
      </p>

      <div className="mt-8">
        <div className="flex items-center space-x-4">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/talk-to-us"
          >
            Talk to us
          </Link>

          <a
            className={buttonVariants()}
            href="https://project-aqua-admin.vercel.app"
          >
            Get Early Access
          </a>
        </div>
      </div>

      <p className="mt-6 text-muted-foreground text-xs">
        No credit card required.
      </p>
    </section>
  );
}
