import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { Button } from "@project-aqua/ui/components/button";
import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/section";
import { SupportForm } from "@/components/support-form";
import { GITHUB_ISSUES_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Ask about meet files, billing, or something that broke on a real pack. Bugs can go to GitHub issues.",
};

export default function SupportPage() {
  return (
    <>
      <PageIntro
        title="If the HY3 will not open, tell us."
        description="Product questions, billing, and import failures belong here. Feature ideas and bugs can also go on GitHub."
      />
      <Section className="grid gap-10 pt-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <SupportForm />
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertTitle>GitHub issues</AlertTitle>
            <AlertDescription>
              Public bugs and format fixtures are easier to track in the
              repository.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="press-scale w-fit"
            render={
              <a href={GITHUB_ISSUES_URL} target="_blank" rel="noreferrer" />
            }
            nativeButton={false}
          >
            Open an issue
          </Button>
        </div>
      </Section>
    </>
  );
}
