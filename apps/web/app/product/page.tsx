import { Separator } from "@project-aqua/ui/components/separator";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingCta } from "@/components/marketing-cta";
import { ProductShot } from "@/components/product-shot";
import { PageIntro } from "@/components/section";
import { audienceLinks, coachEasier, productLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Roster, entries, results, workouts, calendar, progression, and analytics for club and high school swim coaches.",
};

export default function ProductPage() {
  return (
    <>
      <PageIntro
        title="Your team. Your entries. Someone else still runs the meet."
        description="Club and high school without signing out. Meet files stay with the head coach."
      />
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
        <h2 className="font-display max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
          What gets easier on meet week.
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {coachEasier.map((item) => (
            <li key={item.title} className="border-t border-foreground/10 pt-5">
              <Link
                href={item.href}
                className="group flex flex-col gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <span className="font-medium group-hover:underline group-focus-visible:underline">
                  {item.title}
                </span>
                <span className="text-muted-foreground text-sm text-pretty">
                  {item.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 md:px-6">
        <ProductShot shot="dashboard" bleed showCaption={false} />
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 md:grid-cols-12 md:px-6">
        {productLinks.map((item, index) => (
          <article
            key={item.href}
            className={index === 0 ? "md:col-span-8" : "md:col-span-4"}
          >
            <ProductShot
              shot={item.shot}
              showCaption={false}
              compact={index !== 0}
            />
            <div className="mt-4 flex flex-col gap-1">
              <Link href={item.href} className="font-medium hover:underline">
                {item.title}
              </Link>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 md:grid-cols-2 md:px-6">
        {audienceLinks.map((item) => (
          <div key={item.href} className="border-t pt-6">
            <Link href={item.href} className="font-medium hover:underline">
              {item.title}
            </Link>
            <p className="text-muted-foreground mt-1 text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </section>
      <Separator className="mx-auto max-w-6xl" />
      <MarketingCta />
    </>
  );
}
