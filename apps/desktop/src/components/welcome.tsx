import { Button } from "@lane4hq/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@lane4hq/ui/components/empty";
import { FileSearch, FolderOpen } from "lucide-react";

const FORMATS = ["SD3", "HY3", "CL2", "EV3", "HYV", "XLS", "ZIP"];

export function Welcome({ onOpen }: { onOpen: () => void }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSearch />
        </EmptyMedia>
        <EmptyTitle>Inspect a meet file</EmptyTitle>
        <EmptyDescription>
          Open or drop a Meet Manager or Team Manager export to see exactly what
          Lane4 parses from it: events, entries, results, and relays. Everything
          stays on this computer.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onOpen}>
          <FolderOpen />
          Open files
        </Button>
        <p className="font-mono text-xs text-muted-foreground">
          {FORMATS.join(" · ")}
        </p>
      </EmptyContent>
    </Empty>
  );
}
