import { auth } from "@project-aqua/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { checkBotId } from "botid/server";

const handler = toNextJsHandler(auth);

const BOT_PROTECTED_POST_PATHS = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email",
  "/api/auth/request-password-reset",
]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export const GET = handler.GET;

export async function POST(request: Request) {
  const pathname = normalizePathname(new URL(request.url).pathname);

  if (BOT_PROTECTED_POST_PATHS.has(pathname)) {
    const verification = await checkBotId();
    if (verification.isBot) {
      return Response.json(
        { message: "Access denied", code: "BOT_DETECTED" },
        { status: 403 },
      );
    }
  }

  return handler.POST(request);
}
