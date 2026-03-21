"use client";

import { cn } from "@project-aqua/design-system/lib/utils";
import { useDropzone } from "react-dropzone";

const ACCEPTED_EXTENSIONS = [".sd3", ".hy3", ".cl2", ".hyv", ".ev3"];

export function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => onFiles(accepted),
    // react-dropzone needs custom validator for non-MIME types like .sd3
    validator: (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ACCEPTED_EXTENSIONS.includes(`.${ext}`)) {
        return {
          code: "file-invalid-type",
          message: `Unsupported type: .${ext}`,
        };
      }
      return null;
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/30"
      )}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <svg
          aria-hidden="true"
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="font-medium text-sm">
        {isDragActive ? "Drop files here" : "Drop Hytek files here"}
      </p>
      <p className="mt-1 text-muted-foreground text-xs">
        .sd3 .hy3 .cl2 .hyv .ev3 — single or multiple files
      </p>
    </div>
  );
}
