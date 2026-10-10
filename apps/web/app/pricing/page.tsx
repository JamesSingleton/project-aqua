import { Badge } from "@lane4hq/ui/components/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@lane4hq/ui/components/card";
import { Separator } from "@lane4hq/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@lane4hq/ui/components/table";
import { CtaLink } from "@/components/cta-link";
import { MarketingCta } from "@/components/marketing-cta";
import { PageIntro } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";
import { plans } from "@/lib/site";

export const metadata = pageMetadata(
  "Pricing",
  "Free includes unlimited swimmers, meet import, seed times, and progression for club and high school. Pro adds coach seats, lineup suggestions, and a roster-wide cut list.",
);

const comparison = [
  {
    feature: "Swimmers",
    free: "Unlimited",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  { feature: "Coach seats", free: "1", pro: "5", enterprise: "Unlimited" },
  {
    feature: "Meets, import, and entry export",
    free: "Yes",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Seed times from best times",
    free: "Yes",
    pro: "Yes",
    enterprise: "Yes",
  },
  { feature: "Progression", free: "Yes", pro: "Yes", enterprise: "Yes" },
  {
    feature: "SWIMS roster sync",
    free: "Club teams",
    pro: "Club teams",
    enterprise: "Club teams",
  },
  {
    feature: "High school event limits",
    free: "Yes",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Yardage, attendance, and top times",
    free: "Yes",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Lineup suggestions",
    free: "No",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Roster-wide cut list",
    free: "No",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Practice drafts and relay suggestions / month",
    free: "5",
    pro: "20, then overage",
    enterprise: "100, then overage",
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <PageIntro
        title="Pay when the staff grows, not when you enter a meet."
        description="Free covers a season for one coach: unlimited swimmers, meet files, seed times, and progression, for a club or a high school. Pro adds seats, lineup suggestions, and a roster-wide cut list. Billing is per team."
      />
      <section className="mx-auto grid w-full max-w-6xl items-stretch gap-4 px-4 pb-16 md:grid-cols-3 md:px-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.featured ? "h-full ring-foreground/20" : "h-full"}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.featured ? <Badge>Start here</Badge> : null}
              </div>
              <CardDescription>{plan.seats}</CardDescription>
            </CardHeader>
            <p className="text-muted-foreground min-h-10 px-4 text-sm text-pretty">
              {plan.summary}
            </p>
            <ul className="flex flex-1 flex-col gap-2 px-4 text-sm">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <CardFooter className="mt-auto">
              <CtaLink
                href={plan.href}
                variant={plan.featured ? "default" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </CtaLink>
            </CardFooter>
          </Card>
        ))}
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
        <Table aria-label="Features included on Free, Pro, and Enterprise">
          <TableHeader>
            <TableRow>
              <TableHead>Included</TableHead>
              <TableHead>Free</TableHead>
              <TableHead>Pro</TableHead>
              <TableHead>Enterprise</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparison.map((row) => (
              <TableRow key={row.feature}>
                <TableCell className="font-medium">{row.feature}</TableCell>
                <TableCell>{row.free}</TableCell>
                <TableCell>{row.pro}</TableCell>
                <TableCell>{row.enterprise}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <Separator className="mx-auto max-w-6xl" />
      <MarketingCta
        title="Start on Free. Add coaches when the staff shares the desk."
        body="Create the team, import a meet, and add seats from team settings when you need them. The same plans cover a club and a high school."
      />
    </>
  );
}
