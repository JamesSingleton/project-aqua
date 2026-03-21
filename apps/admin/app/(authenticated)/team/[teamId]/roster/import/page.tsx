"use client";
import { Button } from "@project-aqua/design-system/components/ui/button";
import { parseCl2 } from "@project-aqua/parsers/cl2";
import { parseEv3 } from "@project-aqua/parsers/ev3";
import { parseHy3 } from "@project-aqua/parsers/hy3";
import { parseHyv } from "@project-aqua/parsers/hyv";
import { parseSd3 } from "@project-aqua/parsers/sd3";
import type {
  Cl2File,
  Ev3File,
  Hy3File,
  HyvFile,
  Sd3File,
} from "@project-aqua/parsers/types";
import { useCallback, useState } from "react";
import { Header } from "@/components/header";
import { DropZone } from "./_components/dropzone";
import { ParsedFileCard } from "./_components/parsed-file-card";

export type FileType = "sd3" | "hy3" | "cl2" | "hyv" | "ev3" | "unknown";

export interface ParsedFile {
  data?: Sd3File | HyvFile | Ev3File | Cl2File | Hy3File;
  error?: string;
  id: string;
  name: string;
  size: number;
  type: FileType;
}

function getFileType(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["sd3", "hy3", "cl2", "hyv", "ev3"].includes(ext)) {
    return ext as FileType;
  }
  return "unknown";
}

export default function ImportRosterPage() {
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [parsing, setParsing] = useState(false);

  const handleFiles = useCallback(async (incoming: File[]) => {
    setParsing(true);
    const results: ParsedFile[] = [];

    for (const file of incoming) {
      const type = getFileType(file.name);
      const id = `${file.name}-${Date.now()}`;
      const buf = Buffer.from(await file.arrayBuffer());

      try {
        let data: Sd3File | HyvFile | Ev3File | Cl2File | Hy3File;
        if (type === "sd3") {
          data = parseSd3(buf);
        } else if (type === "hyv") {
          data = parseHyv(buf);
        } else if (type === "ev3") {
          data = parseEv3(buf);
        } else if (type === "cl2") {
          data = parseCl2(buf);
        } else if (type === "hy3") {
          data = parseHy3(buf);
        } else {
          throw new Error(`Unsupported file type: .${type}`);
        }

        results.push({ id, name: file.name, type, size: file.size, data });
      } catch (err) {
        results.push({
          id,
          name: file.name,
          type,
          size: file.size,
          error: err instanceof Error ? err.message : "Parse failed",
        });
      }
    }

    setParsedFiles((prev) => [...prev, ...results]);
    setParsing(false);
  }, []);

  return (
    <>
      <Header page="Roster Import" pages={["Roster"]} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 md:gap-6 md:px-6 md:pb-6">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Hytek File Inspector
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Upload SD3, HY3, CL2, HYV, or EV3 files to inspect their parsed
            contents.
          </p>
        </div>
        <DropZone onFiles={handleFiles} />
        {parsing && (
          <p className="animate-pulse text-muted-foreground text-sm">
            Parsing files...
          </p>
        )}

        {parsedFiles.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {parsedFiles.length} file{parsedFiles.length === 1 ? "" : "s"}{" "}
              loaded
            </p>
            <Button
              className="text-muted-foreground text-xs"
              onClick={() => setParsedFiles([])}
              size="sm"
              variant="ghost"
            >
              Clear all
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {parsedFiles.map((file) => (
            <ParsedFileCard file={file} key={file.id} />
          ))}
        </div>
      </div>
    </>
  );
}
