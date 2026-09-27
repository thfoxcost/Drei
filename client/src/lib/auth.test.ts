import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";
import { createAuth } from "./auth";

/**
 * Origin handling is the part of the auth configuration a deployment gets
 * wrong, and the failure it produces - a 403 "Invalid origin" on sign-in - is
 * indistinguishable from a password problem from the browser's point of view.
 *
 * These tests pin the behaviour that matters:
 *
 *   - a request from the configured public origin is accepted, and produces a
 *     session the Go backend can later resolve from the cookie alone,
 *   - a request from any other origin is rejected, which is what keeps CSRF
 *     protection on,
 *   - the accepted origin comes from the environment, is required in production,
 *     and cannot be contradicted by the second name for the same value.
 *
 * The database is in-memory, so no Postgres is needed: the origin check runs
 * before any query, and the rest of the flow is the code path a deployed
 * instance runs. Each test gets its own instance, and therefore its own
 * database, so a session from one case cannot satisfy another.
 */

/** RFC 5737 TEST-NET-3: reserved for documentation, never routable. */
const PUBLIC_ORIGIN = "http://203.0.113.10:3000";
const FOREIGN_ORIGIN = "http://203.0.113.11:3000";

const SECRET = "test-secret-not-a-real-secret";
const PASSWORD = "correct-horse-battery-staple";

process.env.BETTER_AUTH_SECRET = SECRET;
process.env.BETTER_AUTH_TELEMETRY = "0";

type Auth = ReturnType<typeof createAuth>;

/** An instance with an empty database, configured by the given environment. */
function authWith(
	env: Record<string, string> = { PUBLIC_URL: PUBLIC_ORIGIN },
): Auth {
	return createAuth(
		memoryAdapter({ user: [], session: [], account: [], verification: [] }),
		env,
	);
}

/**
 * A browser request, the way one reaches the SSR handler: the request URL and
 * the Origin header both carry the address the user is on, and a cookie is
 * present, which is what engages the CSRF check.
 */
function browserRequest(
	path: string,
	origin: string,
	init: { method?: string; body?: unknown; cookie?: string } = {},
) {
	return new Request(`${origin}/api/auth/${path}`, {
		method: init.method ?? "POST",
		headers: {
			"content-type": "application/json",
			origin,
			cookie: init.cookie ?? "drei.probe=1",
		},
		body: init.body === undefined ? undefined : JSON.stringify(init.body),
	});
}

function signUp(auth: Auth, origin: string, email: string) {
	return auth.handler(
		browserRequest("sign-up/email", origin, {
			body: { name: "Tester", email, password: PASSWORD },
		}),
	);
}

function signIn(auth: Auth, origin: string, email: string, cookie?: string) {
	return auth.handler(
		browserRequest("sign-in/email", origin, {
			body: { email, password: PASSWORD },
			cookie,
		}),
	);
}

/** The session cookie better-auth set, as a Cookie header. */
function sessionCookie(response: Response): string {
	const [cookie] = response.headers.getSetCookie();
	const pair = cookie?.split(";")[0];

	if (!pair) {
		throw new Error(
			`no session cookie was set: ${response.status} ${response.statusText}`,
		);
	}

	return pair;
}

describe("better-auth public origin configuration", () => {
	it("rejects a configuration that names two different origins", () => {
		expect(() =>
			authWith({
				PUBLIC_URL: PUBLIC_ORIGIN,
				BETTER_AUTH_URL: "http://localhost:3000",
			}),
		).toThrow(/same origin/);
	});

	it("rejects a public URL without a scheme", () => {
		expect(() => authWith({ PUBLIC_URL: "203.0.113.10:3000" })).toThrow(
			/absolute URL/,
		);
	});

	it("rejects a missing public URL in production", () => {
		expect(() => authWith({ NODE_ENV: "production" })).toThrow(
			/required in production/,
		);
	});

	it("accepts BETTER_AUTH_URL as an alias and tolerates a trailing slash", () => {
		expect(authWith({ BETTER_AUTH_URL: `${PUBLIC_ORIGIN}/` })).toBeDefined();
	});

	it("accepts a sign-up from the configured origin and sets a session cookie", async () => {
		const res = await signUp(authWith(), PUBLIC_ORIGIN, "one@example.com");

		expect(res.status).toBe(200);
		expect(sessionCookie(res)).toContain("=");
	});

	it("rejects a sign-up from any other origin", async () => {
		const res = await signUp(authWith(), FOREIGN_ORIGIN, "two@example.com");

		expect(res.status).toBe(403);
		expect(await res.json()).toMatchObject({ code: "INVALID_ORIGIN" });
	});

	it("rejects a sign-up sent with the alias variable set instead", async () => {
		const res = await signUp(
			authWith({ BETTER_AUTH_URL: PUBLIC_ORIGIN }),
			FOREIGN_ORIGIN,
			"three@example.com",
		);

		expect(res.status).toBe(403);
		expect(await res.json()).toMatchObject({ code: "INVALID_ORIGIN" });
	});

	it("resolves the session from the cookie alone, the way the backend does", async () => {
		const auth = authWith();
		const cookie = sessionCookie(
			await signUp(auth, PUBLIC_ORIGIN, "four@example.com"),
		);

		// The Go backend resolves a session by forwarding only the cookie: a
		// GET, with no Origin header of its own.
		const session = await auth.handler(
			new Request(`${PUBLIC_ORIGIN}/api/auth/get-session`, {
				headers: { cookie },
			}),
		);

		expect(session.status).toBe(200);

		const body = await session.json();
		expect(body.user.email).toBe("four@example.com");
		expect(body.session.id).toBeTypeOf("string");
	});

	it("signs in from the configured origin and returns a new session", async () => {
		const auth = authWith();
		const signedUp = await signUp(auth, PUBLIC_ORIGIN, "five@example.com");

		const res = await signIn(
			auth,
			PUBLIC_ORIGIN,
			"five@example.com",
			sessionCookie(signedUp),
		);

		expect(res.status).toBe(200);
		expect((await res.json()).user.email).toBe("five@example.com");
		expect(sessionCookie(res)).toContain("=");
	});

	it("rejects a sign-in from any other origin", async () => {
		const res = await signIn(authWith(), FOREIGN_ORIGIN, "six@example.com");

		expect(res.status).toBe(403);
		expect(await res.json()).toMatchObject({ code: "INVALID_ORIGIN" });
	});

	it("adds BETTER_AUTH_TRUSTED_ORIGINS to the configured origin", async () => {
		process.env.BETTER_AUTH_TRUSTED_ORIGINS = FOREIGN_ORIGIN;

		try {
			const res = await signUp(authWith(), FOREIGN_ORIGIN, "seven@example.com");

			expect(res.status).toBe(200);
		} finally {
			delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;
		}
	});
});
