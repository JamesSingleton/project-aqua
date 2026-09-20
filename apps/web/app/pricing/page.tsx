import { Badge } from "@project-aqua/ui/components/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import type { Metadata } from "next";
import { CtaLink } from "@/components/cta-link";
import { MarketingCta } from "@/components/marketing-cta";
import { PageIntro } from "@/components/section";
import { plans } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free includes unlimited swimmers, meet import, seed times, and progression. Pro adds staff seats, lineup suggestions, and advanced analytics.",
};

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
  { feature: "SWIMS roster sync", free: "Yes", pro: "Yes", enterprise: "Yes" },
  {
    feature: "Lineup and relay suggestions",
    free: "No",
    pro: "Yes",
    enterprise: "Yes",
  },
  { feature: "Advanced analytics", free: "No", pro: "Yes", enterprise: "Yes" },
  {
    feature: "AI draft generations / month",
    free: "5",
    pro: "20 + overage",
    enterprise: "100 + overage",
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <PageIntro
        title="Pay when the staff grows, not when you enter a meet."
        description="Free is enough to run a season: unlimited swimmers, meet files, seed times, and progression. Pro adds staff seats and lineup suggestions. Billing is per team, not per athlete."
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
        title="Upgrade from billing, after you have a team."
        body="Create the team on Free, import a meet, then add seats from team settings when the staff needs to share the desk."
      />
    </>
  );
}
