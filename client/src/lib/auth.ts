import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
    database: new Database("./sqlite.db"),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
  },
    plugins: [tanstackStartCookies()]
})