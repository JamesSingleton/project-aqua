import { authMiddleware } from "@project-aqua/auth/proxy";

export default authMiddleware();

export const config = {
  matcher: ["/team/:path*"],
};
