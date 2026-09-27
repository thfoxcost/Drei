import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";

const pool = new Pool({
	connectionString: process.env.DB_HOST!,
});

/**
 * Names this deployment uses for its public address.
 *
 * PUBLIC_URL is Drei's own name. BETTER_AUTH_URL is better-auth's name for the
 * same value and is accepted as an alias, so a deployment can set either one.
 * Neither is defaulted here: a wrong default is precisely what makes sign-in
 * fail with "Invalid origin" on every address except the default one.
 */
const PUBLIC_URL_VARS = ["PUBLIC_URL", "BETTER_AUTH_URL"] as const;

/** Parses a public URL, rejecting anything better-auth could not use as one. */
function parsePublicURL(name: string, value: string): URL {
	let url: URL;

	try {
		url = new URL(value);
	} catch {
		throw new Error(
			`[drei] ${name} must be an absolute URL including the scheme, for example http://drei.lan:3000 or https://drei.example.com. Got: ${value}`,
		);
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(
			`[drei] ${name} must use http or https so it matches the origin the browser sends. Got: ${value}`,
		);
	}

	if (url.hostname === "") {
		throw new Error(`[drei] ${name} must include a host. Got: ${value}`);
	}

	return url;
}

/**
 * Resolves the public address of this deployment, without a trailing slash.
 *
 * Returns undefined when neither variable is set, which is a legitimate state
 * in development only: better-auth then falls back to the origin of the
 * incoming request. That fallback is never correct for a deployed instance,
 * because the address users type and the address the request arrives on are
 * then the only thing keeping origin validation honest.
 *
 * Both variables are compared rather than merged. If they disagree, one of them
 * is wrong, and silently preferring either is how a deployment ends up
 * rejecting the very origin it is served on.
 */
function resolvePublicURL(env: NodeJS.ProcessEnv): string | undefined {
	const configured: { name: string; value: string }[] = [];

	for (const name of PUBLIC_URL_VARS) {
		const value = env[name]?.trim();

		if (value) {
			configured.push({ name, value });
		}
	}

	if (configured.length === 0) {
		return undefined;
	}

	const [primary, ...rest] = configured;
	parsePublicURL(primary.name, primary.value);

	for (const other of rest) {
		const parsed = parsePublicURL(other.name, other.value);

		// Origins are compared, not full URLs: a deployment served under a path
		// prefix may spell the path differently in the two variables, but the
		// scheme, host and port that better-auth validates against must not
		// differ.
		if (parsed.origin !== new URL(primary.value).origin) {
			throw new Error(
				`[drei] ${other.name} (${other.value}) and ${primary.name} (${primary.value}) must be the same origin: better-auth validates request origins against a single value, and these two disagree.`,
			);
		}
	}

	// Trailing slashes are stripped so the value can be compared and logged
	// without a cosmetic difference from the origin the browser sends.
	return primary.value.replace(/\/+$/, "");
}

/**
 * Builds the auth instance for a database.
 *
 * The environment is a parameter so the origin handling can be exercised
 * without a running Postgres: the origin check runs before any query, so the
 * whole sign-in path is testable against an in-memory database.
 */
export function createAuth(
	database: BetterAuthOptions["database"],
	env: NodeJS.ProcessEnv = process.env,
) {
	const publicURL = resolvePublicURL(env);

	if (publicURL === undefined && env.NODE_ENV === "production") {
		throw new Error(
			"[drei] PUBLIC_URL is required in production. It is the address users reach this deployment on, and better-auth validates every sign-in and sign-up against exactly that origin. Set PUBLIC_URL (and let BETTER_AUTH_URL default to it) in the deployment environment.",
		);
	}

	return betterAuth({
		// baseURL fixes the public address of the auth API. It is what
		// better-auth builds absolute URLs, cookie attributes and redirects
		// from, so it must never be left to be derived per request in a
		// deployment.
		...(publicURL ? { baseURL: publicURL } : {}),
		// trustedOrigins is set explicitly rather than left implicit. The
		// baseURL origin is trusted automatically, but stating it here is what
		// makes the accepted origin auditable in one place, and
		// BETTER_AUTH_TRUSTED_ORIGINS is appended to it by better-auth for
		// deployments reachable under more than one address.
		...(publicURL ? { trustedOrigins: [new URL(publicURL).origin] } : {}),
		advanced: {
			// better-auth skips origin validation in a test environment unless
			// this is stated, which would make a test of the origin handling pass
			// without checking anything. Stating it as false also means no
			// environment variable or NODE_ENV value can quietly turn the check
			// off in a deployment.
			disableOriginCheck: false,
		},
		database,
		emailAndPassword: {
			enabled: true,
		},
		plugins: [tanstackStartCookies()],
	});
}

export const auth = createAuth(pool);
