import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open, save } from "@tauri-apps/plugin-dialog";
import { basename, MEET_FILE_EXTENSIONS, type SourceFile } from "./meet-file";

export { isTauri };

export async function readMeetFile(path: string): Promise<SourceFile> {
  const buffer = await invoke<ArrayBuffer>("read_meet_file", { path });
  return { filename: basename(path), bytes: new Uint8Array(buffer) };
}

export function readMeetFiles(paths: string[]): Promise<SourceFile[]> {
  return Promise.all(paths.map(readMeetFile));
}

/** Native open dialog. Resolves to [] when the user cancels. */
export async function pickMeetFilePaths(
  title = "Open meet files",
): Promise<string[]> {
  const selected = await open({
    multiple: true,
    directory: false,
    title,
    filters: [{ name: "Meet files", extensions: [...MEET_FILE_EXTENSIONS] }],
  });
  if (!selected) return [];
  return Array.isArray(selected) ? selected : [selected];
}

const BROWSER_ACCEPT = MEET_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

function pickBrowserFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = BROWSER_ACCEPT;
    input.addEventListener("change", () => resolve([...(input.files ?? [])]));
    input.addEventListener("cancel", () => resolve([]));
    input.click();
  });
}

/**
 * Let the user choose meet files and read them. Resolves to [] on cancel.
 * Uses the native dialog in the app and a file input in `dev:web`.
 */
export async function pickSourceFiles(title?: string): Promise<SourceFile[]> {
  if (isTauri()) {
    return readMeetFiles(await pickMeetFilePaths(title));
  }
  const files = await pickBrowserFiles();
  return Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );
}

function extensionOf(filename: string): string {
  return filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
}

function downloadInBrowser(file: SourceFile) {
  const url = URL.createObjectURL(
    new Blob([file.bytes as BlobPart], { type: "application/octet-stream" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Ask where to save an exported meet file, then write it.
 * Resolves to the saved file's name, or null when the user cancels.
 */
export async function saveMeetFile(file: SourceFile): Promise<string | null> {
  if (!isTauri()) {
    downloadInBrowser(file);
    return file.filename;
  }
  const extension = extensionOf(file.filename);
  const chosen = await save({
    title: "Export meet file",
    defaultPath: file.filename,
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
  });
  if (!chosen) return null;
  const path = chosen.toLowerCase().endsWith(`.${extension}`)
    ? chosen
    : `${chosen}.${extension}`;
  await invoke("write_meet_file", file.bytes, {
    headers: { path: encodeURIComponent(path) },
  });
  return basename(path);
}

export type DropState = "idle" | "over";

/** Subscribe to OS file drops on the window. Returns an unsubscribe function. */
export function onFileDrop(handlers: {
  onDrop: (paths: string[]) => void;
  onStateChange: (state: DropState) => void;
}): () => void {
  let unlisten: (() => void) | undefined;
  let cancelled = false;
  getCurrentWebview()
    .onDragDropEvent((event) => {
      const { type } = event.payload;
      if (type === "enter" || type === "over") {
        handlers.onStateChange("over");
      } else if (type === "leave") {
        handlers.onStateChange("idle");
      } else if (type === "drop") {
        handlers.onStateChange("idle");
        if (event.payload.paths.length > 0) {
          handlers.onDrop(event.payload.paths);
        }
      }
    })
    .then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });
  return () => {
    cancelled = true;
    unlisten?.();
  };
}
