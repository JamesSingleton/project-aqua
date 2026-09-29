import { invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
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
export async function pickMeetFilePaths(): Promise<string[]> {
  const selected = await open({
    multiple: true,
    directory: false,
    title: "Open meet files",
    filters: [{ name: "Meet files", extensions: [...MEET_FILE_EXTENSIONS] }],
  });
  if (!selected) return [];
  return Array.isArray(selected) ? selected : [selected];
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
