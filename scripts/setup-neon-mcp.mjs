import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const context = JSON.parse(await readFile(".neon", "utf8"));
if (typeof context.projectId !== "string" || context.projectId.length === 0) {
  throw new Error("Run `neon link` before configuring the Neon MCP server.");
}

const result = spawnSync(
  "neon",
  [
    "mcp",
    "--project",
    "--oauth",
    "--project-id",
    context.projectId,
    "--agent",
    "cursor",
    "--agent",
    "claude-code",
    "--yes",
  ],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Neon MCP setup exited with status ${result.status}`);
}
