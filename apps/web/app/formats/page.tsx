import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Badge } from "@project-aqua/ui/components/badge";
import { Separator } from "@project-aqua/ui/components/separator";
import type { Metadata } from "next";
import { MarketingCta } from "@/components/marketing-cta";
import { PageIntro } from "@/components/section";
import { formats } from "@/lib/site";

export const metadata: Metadata = {
  title: "File formats",
  description:
    "HY3, CL2, EV3, HYV, SDIF/SD3, XLS event reports, and ZIP packs. The interchange Project Aqua reads and writes.",
};

export default function FormatsPage() {
  return (
    <>
      <PageIntro
        title="They already know how to open these files."
        description="You build the lineup once. Export the file Meet Manager, SwimTopia, SwimCloud, or TeamUnify already opens."
      />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 md:px-6">
        <Alert>
          <AlertTitle>We do not run the meet</AlertTitle>
          <AlertDescription>
            If you are putting the invitational on, you still use Meet Manager,
            SwimTopia, SwimCloud, or TeamUnify to receive files and run the
            pool. Project Aqua does not merge other clubs’ entries or replace a
            timing console.
          </AlertDescription>
        </Alert>
        <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {formats.map((format) => (
            <li key={format.code} className="flex flex-col gap-2">
              <Badge variant="secondary" className="w-fit">
                {format.code}
              </Badge>
              <p className="text-muted-foreground text-sm text-pretty">
                {format.use}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <Separator className="mx-auto max-w-6xl" />
      <MarketingCta />
    </>
  );
}
