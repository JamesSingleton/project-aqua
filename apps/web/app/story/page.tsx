import { Separator } from "@project-aqua/ui/components/separator";
import type { Metadata } from "next";
import { MarketingCta } from "@/components/marketing-cta";
import { PageIntro } from "@/components/section";

export const metadata: Metadata = {
  title: "Story",
  description:
    "Why Project Aqua exists: the swim team management software I wish I had 10 years ago.",
};

export default function StoryPage() {
  return (
    <>
      <PageIntro
        title="The swim team management software I wish I had 10 years ago."
        description="I was the coach with a club team and a high school team, two logins, and a spreadsheet of best times."
      />
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 text-muted-foreground md:px-6">
        <p>
          The week did not change. Import the event file. Type seed times. Email
          a HY3. Print something that looked like a heat sheet. Merge results by
          hand. Then do it again for the other program.
        </p>
        <p>
          Club software wanted dues and parents. Meet software wanted the
          director’s seat. None of them wanted the week I actually had: entries
          for the team I was taking that weekend, paper reports, and times that
          stayed with the program I was coaching that afternoon.
        </p>
        <p>
          Project Aqua is that week. Roster, lineup, the file they asked for, a
          split sheet, results, progression. One login for more than one team.
          Seed times on the free plan. No parent portal, because that was never
          the job.
        </p>
      </section>
      <Separator className="mx-auto max-w-6xl" />
      <MarketingCta />
    </>
  );
}
