import type { ParsedCl2File } from "@project-aqua/parsers/cl2";
import { Cl2ResultsView } from "./cl2-results";
import { Cl2RosterView } from "./cls-roster";

export function Cl2View({ data }: { data: ParsedCl2File }) {
  if (data.fileType === "roster") {
    return <Cl2RosterView data={data} />;
  }
  if (data.fileType === "results" || data.fileType === "entries") {
    return <Cl2ResultsView data={data} />;
  }
  return (
    <div className="p-4 text-muted-foreground text-sm">
      Unknown CL2 file type (fileCode: {data.fileCode}). Raw lines:{" "}
      {data.rawLines.length}
    </div>
  );
}
