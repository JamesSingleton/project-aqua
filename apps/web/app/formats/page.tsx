import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@lane4hq/ui/components/alert";
import { Badge } from "@lane4hq/ui/components/badge";
import { Separator } from "@lane4hq/ui/components/separator";
import { MarketingCta } from "@/components/marketing-cta";
import { PageIntro } from "@/components/section";
import { pageMetadata } from "@/lib/metadata";
import { formats } from "@/lib/site";

export const metadata = pageMetadata(
  "File formats",
  "HY3, CL2, EV3, HYV, SDIF/SD3, XLS event reports, and ZIP packs for club and high school meet files.",
);

export default function FormatsPage() {
  return (
    <>
      <PageIntro
        title="The host already knows how to open these files."
        description="You build the lineup once. Export the file Meet Manager, SwimTopia, SwimCloud, or TeamUnify already uses."
      />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 md:px-6">
        <Alert>
          <AlertTitle>We do not run the meet</AlertTitle>
          <AlertDescription>
            If you are putting the invitational or the dual on, you still use
            Meet Manager, SwimTopia, SwimCloud, or TeamUnify to receive files
            and run the pool. Lane4 HQ does not merge other teams&apos; entries
            or replace a timing console.
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
