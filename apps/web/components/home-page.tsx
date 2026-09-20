import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import { FaqList } from "@/components/faq-list";
import { MarketingCta } from "@/components/marketing-cta";
import { ProductShot } from "@/components/product-shot";
import { Section } from "@/components/section";
import {
  formats,
  meetWeek,
  PRIMARY_CTA,
  productLinks,
  SIGN_UP_URL,
  weekLoad,
} from "@/lib/site";

export function HomePage() {
  return (
    <>
      <Section className="grid items-end gap-12 pt-20 md:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
        <div className="hero-copy flex max-w-3xl flex-col items-start gap-6">
          <h1 className="font-display text-[2.6rem] font-semibold tracking-tight text-pretty sm:text-6xl lg:text-[4.35rem] lg:leading-[0.95]">
            Your roster. Your entries. Their times.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-pretty">
            Software for swim coaches. Who&apos;s on the team, who&apos;s
            entered this weekend, and how they&apos;re swimming — in one place.
            We don&apos;t run the meet.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <CtaLink href={SIGN_UP_URL} icon>
              {PRIMARY_CTA}
            </CtaLink>
            <CtaLink href="#product" variant="outline">
              See the team
            </CtaLink>
          </div>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground text-pretty lg:justify-self-end">
          One login for the club team and the high school. Times stay with the
          team you&apos;re coaching today.
        </p>
      </Section>

      <section
        id="product"
        aria-labelledby="product-heading"
        className="mx-auto w-full max-w-6xl px-4 md:px-6"
      >
        <h2 id="product-heading" className="sr-only">
          Team screenshots
        </h2>
        <ProductShot
          shot="dashboard"
          priority
          bleed
          showCaption={false}
          className="lg:-mt-4"
        />
      </section>

      <Section className="grid gap-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            The work that never makes the heat sheet.
          </h2>
          <p className="text-muted-foreground text-pretty">
            Every meet still asks the same things of a coach: who&apos;s going,
            what they seed, and whether Sunday&apos;s results make it back onto
            the roster. None of that shows up on the heat sheet.
          </p>
        </div>
        <ul className="flex flex-col">
          {weekLoad.map((item) => (
            <li
              key={item.waste}
              className="grid gap-3 border-t border-foreground/10 py-8 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8"
            >
              <p className="font-medium">{item.waste}</p>
              <p className="text-muted-foreground text-sm text-pretty">
                <span className="sr-only">Before: </span>
                {item.from}
              </p>
              <p className="text-sm text-pretty">
                <span className="sr-only">Instead: </span>
                {item.to}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl md:leading-[1.05]">
            Entries in meet order, not a spreadsheet of names by event.
          </h2>
          <p className="text-muted-foreground text-pretty">
            Individuals and relays in event order, the way the meet is swum.
            Switch to by-swimmer when you&apos;re checking who has too many
            events. Seed times come from best times. High school event limits
            show up before you send the file.
          </p>
          <CtaLink
            href="/product/meets"
            variant="outline"
            size="default"
            className="w-fit"
          >
            Meet entries
          </CtaLink>
        </div>
        <ProductShot shot="entries" showCaption={false} />
      </Section>

      <Section className="grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl md:leading-[1.05]">
            Sunday results next to last best, not a paste into Excel.
          </h2>
          <p className="text-muted-foreground text-pretty">
            Bring the results file back in. Previous best is on the row. Turn on
            JO or sectionals without leaving the meet. See who was at practice,
            how much they swam, and who already made the cut.
          </p>
          <div className="flex flex-wrap gap-3">
            <CtaLink
              href="/product/meets"
              variant="outline"
              size="default"
              className="w-fit"
            >
              Results and cuts
            </CtaLink>
            <CtaLink
              href="/product/analytics"
              variant="ghost"
              size="default"
              className="w-fit"
            >
              Analytics
            </CtaLink>
          </div>
        </div>
        <ProductShot shot="results" showCaption={false} />
      </Section>

      <Section className="pt-8">
        <div className="grid gap-5 md:grid-cols-12 md:grid-rows-2">
          <div className="md:col-span-8 md:row-span-2">
            <ProductShot shot="roster" showCaption={false} />
          </div>
          <div className="md:col-span-4">
            <ProductShot shot="calendar" showCaption={false} compact />
          </div>
          <div className="md:col-span-4">
            <ProductShot shot="workouts" showCaption={false} compact />
          </div>
        </div>
        <ul className="mt-12 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {productLinks.map((item) => (
            <li key={item.href} className="border-t border-foreground/10 pt-4">
              <Link
                href={item.href}
                className="group flex min-w-0 flex-col gap-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <span className="font-medium group-hover:underline group-focus-visible:underline">
                  {item.title}
                </span>
                <span className="text-muted-foreground text-sm">
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="meet-week">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Event file in. Entries out. Results back.
          </h2>
          <p className="text-muted-foreground text-pretty">
            The same week you already have. We don&apos;t run the pool.
          </p>
        </div>
        <ol className="mt-14 grid gap-10 md:grid-cols-2">
          {meetWeek.map((step) => (
            <li
              key={step.title}
              className="flex flex-col gap-2 border-t border-foreground/10 pt-6"
            >
              <h3 className="text-lg font-medium">{step.title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="overflow-hidden">
        <div className="flex max-w-xl flex-col gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Files they already know how to open.
          </h2>
          <p className="text-muted-foreground text-pretty">
            You build the lineup once. The people running the meet still get the
            file they asked for.
          </p>
        </div>
        <ul
          aria-label="Supported file formats"
          className="format-rail font-display mt-12 flex flex-wrap gap-x-8 gap-y-3 text-4xl font-semibold tracking-tight text-pretty sm:text-6xl md:text-7xl"
        >
          {formats.map((format) => (
            <li key={format.code} translate="no">
              {format.code}
            </li>
          ))}
        </ul>
        <CtaLink
          href="/formats"
          variant="outline"
          size="default"
          className="mt-10 w-fit"
        >
          Format details
        </CtaLink>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              What this is not
            </h2>
            <p className="text-muted-foreground text-pretty">
              This is for the coach. Not a parent app, not dues, not the timing
              system.
            </p>
          </div>
          <FaqList />
        </div>
      </Section>

      <MarketingCta />
    </>
  );
}
