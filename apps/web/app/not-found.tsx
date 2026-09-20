import { Button } from "@project-aqua/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@project-aqua/ui/components/empty";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center px-4">
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyTitle>That page is not on the heat sheet.</EmptyTitle>
          <EmptyDescription>
            The URL does not match a public marketing page. Head home or open
            the product overview.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              className="press-scale"
              render={<Link href="/" />}
              nativeButton={false}
            >
              Home
            </Button>
            <Button
              variant="outline"
              className="press-scale"
              render={<Link href="/product" />}
              nativeButton={false}
            >
              Product
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
