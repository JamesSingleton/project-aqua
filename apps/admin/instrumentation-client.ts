import { initBotId } from "botid/client/core";

/**
 * Invisible bot checks for high-value Better Auth POSTs.
 * Client challenge tokens are attached automatically; the auth route
 * verifies them with checkBotId() before forwarding to Better Auth.
 */
initBotId({
  protect: [
    { path: "/api/auth/sign-up/email", method: "POST" },
    { path: "/api/auth/sign-in/email", method: "POST" },
    { path: "/api/auth/request-password-reset", method: "POST" },
  ],
});
