import {
  Alert,
  AlertDescription,
} from "@project-aqua/design-system/components/ui/alert";
import { Badge } from "@project-aqua/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@project-aqua/design-system/components/ui/card";
import { ScrollArea } from "@project-aqua/design-system/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/design-system/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@project-aqua/design-system/components/ui/tabs";
import { cn } from "@project-aqua/design-system/lib/utils";
import type { ParsedCl2File } from "@project-aqua/parsers/cl2";
import type { ParsedHy3File } from "@project-aqua/parsers/hy3";
import type { Ev3File, HyvFile, Sd3File } from "@project-aqua/parsers/types";
import type { FileType, ParsedFile } from "../page";
import { Cl2View } from "./cl2-view";
import { Ev3View } from "./ev3-view";
import { Hy3ResultsView } from "./hy3-results";
import { Hy3View } from "./hy3-view";
import { HyvView } from "./hyv-view";
import { Sd3View } from "./sd3-view";

const FILE_TYPE_COLORS: Record<FileType, string> = {
  sd3: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  hy3: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cl2: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  hyv: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  ev3: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  unknown: "bg-muted text-muted-foreground",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function FileTypeBadge({ type }: { type: FileType }) {
  return (
    <Badge
      className={cn("font-mono text-xs uppercase", FILE_TYPE_COLORS[type])}
      variant="secondary"
    >
      {type}
    </Badge>
  );
}

export function ParsedFileCard({ file }: { file: ParsedFile }) {
  if (file.error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileTypeBadge type={file.type} />
            <CardTitle className="font-medium text-sm">{file.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-sm">
              {file.error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!file.data) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTypeBadge type={file.type} />
            <CardTitle className="font-medium text-sm">{file.name}</CardTitle>
          </div>
          <span className="text-muted-foreground text-xs">
            {formatBytes(file.size)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {file.type === "sd3" && <Sd3View data={file.data as Sd3File} />}
        {file.type === "hyv" && <HyvView data={file.data as HyvFile} />}
        {file.type === "ev3" && <Ev3View data={file.data as Ev3File} />}
        {file.type === "cl2" && <Cl2View data={file.data as ParsedCl2File} />}
        {file.type === "hy3" &&
          (() => {
            const hy3data = file.data as ParsedHy3File;
            // Results/entries get a Teams tab; roster is self-contained
            if (
              hy3data.fileType === "results" ||
              hy3data.fileType === "entries"
            ) {
              return (
                <Tabs defaultValue="results">
                  <TabsList className="mb-4">
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="teams">
                      Teams ({hy3data.teams.size})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="results">
                    <Hy3ResultsView data={hy3data} />
                  </TabsContent>
                  <TabsContent value="teams">
                    <ScrollArea className="h-[320px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Abbr</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>LSC</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Coach</TableHead>
                            <TableHead>Athletes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...hy3data.teams.entries()].map(
                            ([abbr, { team, athletes }]) => (
                              <TableRow key={abbr}>
                                <TableCell className="font-medium font-mono">
                                  {abbr}
                                </TableCell>
                                <TableCell>{team.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {team.lsc}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {[team.city, team.state]
                                    .filter(Boolean)
                                    .join(", ")}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {team.coachName}
                                </TableCell>
                                <TableCell>{athletes.length}</TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              );
            }
            return <Hy3View data={hy3data} />;
          })()}
      </CardContent>
    </Card>
  );
}
