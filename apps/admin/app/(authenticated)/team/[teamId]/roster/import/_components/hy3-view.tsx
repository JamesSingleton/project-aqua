import type { ParsedHy3File } from "@project-aqua/parsers/hy3";
import { Hy3ResultsView } from "./hy3-results";
import { Hy3RosterView } from "./hy3-roster";

export function Hy3View({ data }: { data: ParsedHy3File }) {
  if (data.fileType === "roster") {
    return <Hy3RosterView data={data} />;
  }
  if (data.fileType === "results" || data.fileType === "entries") {
    return <Hy3ResultsView data={data} />;
  }
  return (
    <div className="p-4 text-muted-foreground text-sm">
      Unknown HY3 file type (fileCode: {data.fileCode}). Raw lines:{" "}
      {data.rawLines.length}
    </div>
  );
}
