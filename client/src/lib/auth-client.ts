import { createAuthClient } from "better-auth/react";

/**
 * No baseURL is configured on purpose.
 *
 * The client and the auth endpoints are served from the same origin, so
 * better-auth resolves them relative to the current page. Hardcoding an origin
 * here would pin every `useSession()`, `signIn` and `signOut` call to that
 * address, which breaks as soon as the deployment is reached by any other name
 * - a LAN IP, a VPN hostname, or a domain.
 */
export const authClient = createAuthClient();
