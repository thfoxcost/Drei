import { createMiddleware } from "@tanstack/react-start";
import { auth } from "./auth";
import { redirect } from "@tanstack/react-router";

export const authMiddleware = createMiddleware()
  .server(async ({ request, next }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      throw redirect({ to: "/signin" })
    }
    return await next();

  });