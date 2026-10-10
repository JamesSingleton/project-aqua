import { Separator } from "@lane4hq/ui/components/separator";
import { MarketingCta } from "@/components/marketing-cta";
import { PageIntro } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Story",
  "Why Lane4 HQ exists: roster, entries, and results for a coach with a club team, a high school team, or both.",
);

export default function StoryPage() {
  return (
    <>
      <PageIntro
        title="The swim team software I wish I had 10 years ago."
        description="I coached a club team and a high school team. Two logins, and a spreadsheet of best times."
      />
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 text-muted-foreground md:px-6">
        <p>
          The week did not change. Import the event file. Find the seed times.
          Send a HY3. Print something the staff can mark. Bring the results back
          by hand. Then do it again for the other program — the Saturday
          invitational, or the Tuesday dual.
        </p>
        <p>
          Club tools wanted dues and parents. Meet tools wanted the
          director&apos;s seat. I wanted entries for the team I was taking that
          weekend, a split sheet, and times that stayed with the program I was
          coaching that afternoon.
        </p>
        <p>
          Lane4 HQ is that week. Roster, lineup, the file the host asked for,
          results, and progression. One login when the club and the high school
          are both yours. Seed times on the free plan. No parent portal. We
          don&apos;t run the meet, and USA Swimming has not certified or
          approved this product.
        </p>
      </section>
      <Separator className="mx-auto max-w-6xl" />
      <MarketingCta />
    </>
  );
}
