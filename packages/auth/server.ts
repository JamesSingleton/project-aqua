import { database } from "@project-aqua/database";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization, twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Project Aqua",
  database: drizzleAdapter(database, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [nextCookies(), organization(), twoFactor()],
});
