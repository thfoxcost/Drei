/**
 * Drei production server.
 *
 * The client is a TanStack Start SSR app, and the Go backend is a separate
 * service. Both must be reachable from a single origin, otherwise the browser
 * treats them as cross-origin: the session cookie stops being sent on
 * API calls and the backend has to answer with permissive CORS headers.
 *
 * This process is the single origin. It:
 *
 *   1. reverse-proxies the backend's routes to the backend container,
 *   2. serves the built client assets from dist/client,
 *   3. hands everything else to the TanStack Start SSR handler.
 *
 * Route ownership, in order:
 *
 *   /git/*       backend   git over HTTP (CGI passthrough)
 *   /uploads/*   backend   uploaded logos, issue/PR images, org avatars
 *   /swagger/*   backend   generated API documentation
 *   /api/auth/*  this app  better-auth: it is what sets the session cookie,
 *                           and the backend has no such route
 *   /api/memory  this app  process memory probe, served by this app
 *   /api/*       backend   the API
 *   /assets/...  static    Vite output, content-hashed and immutable
 *   /*           SSR       every other path is a router path
 *
 * Only node: builtins are used. The Web Request/Response bridge is hand-rolled
 * on node:stream so the production image needs no extra runtime dependency.
 *
 * It also refuses to start without a public origin. That address is what
 * better-auth validates request origins against, and getting it wrong produces
 * an "Invalid origin" error in the browser with nothing in this process's log
 * to explain it, so the check belongs at boot rather than in a support answer.
 */

import { createReadStream, statSync } from "node:fs"
import { createServer, request as httpRequest } from "node:http"
import { timingSafeEqual } from "node:crypto"
import { extname, join, normalize, resolve, sep } from "node:path"
import { Readable } from "node:stream"
import { fileURLToPath } from "node:url"

const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? "0.0.0.0"

// BACKEND_URL is an internal address. The backend is not published to the host;
// only this process is.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:3200"

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)))
const DIST_DIR = resolve(process.env.DIST_DIR ?? join(ROOT, "dist"))
const CLIENT_DIR = join(DIST_DIR, "client")
const SERVER_ENTRY = join(DIST_DIR, "server", "server.js")

/**
 * The public address of this deployment.
 *
 * PUBLIC_URL is Drei's name for it and BETTER_AUTH_URL is better-auth's name
 * for the same value; either may be set, and docker-compose sets both from one
 * place. client/src/lib/auth.ts derives better-auth's baseURL and
 * trustedOrigins from the same variables, so the SSR server and better-auth
 * cannot end up trusting different origins as long as the environment is
 * checked - which is what resolvePublicOrigin does, and why this file refuses to
 * start rather than serving a deployment whose sign-in will fail.
 *
 * Returns null in development when neither is set, where better-auth falls back
 * to the origin of the incoming request.
 */
function resolvePublicOrigin() {
	const configured = ["PUBLIC_URL", "BETTER_AUTH_URL"]
		.map((name) => [name, (process.env[name] ?? "").trim()])
		.filter(([, value]) => value !== "")

	if (configured.length === 0) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"[drei] PUBLIC_URL is required in production. It is the address users reach this deployment on, and better-auth validates sign-in and sign-up against exactly that origin. Set PUBLIC_URL in the deployment environment.",
			)
		}

		return null
	}

	const origins = new Set()

	for (const [name, value] of configured) {
		let url

		try {
			url = new URL(value)
		} catch {
			throw new Error(
				`[drei] ${name} must be an absolute URL including the scheme, for example http://192.168.1.10:3000 or https://drei.example.com. Got: ${value}`,
			)
		}

		if (url.protocol !== "http:" && url.protocol !== "https:") {
			throw new Error(
				`[drei] ${name} must use http or https so it matches the origin the browser sends. Got: ${value}`,
			)
		}

		origins.add(url.origin)
	}

	if (origins.size > 1) {
		// Better to stop than to pick one: a deployment that trusts two
		// different origins because its own configuration contradicts itself is
		// not a deployment whose origin check can be reasoned about.
		throw new Error(
			`[drei] PUBLIC_URL and BETTER_AUTH_URL must be the same origin, got ${[...origins].join(" and ")}.`,
		)
	}

	const origin = [...origins][0]

	// .invalid is reserved by RFC 2606 and can never resolve, so it is the
	// build-time placeholder from the Dockerfile. Reaching the runtime with it
	// means the deployment environment was never given a real address.
	if (origin.endsWith(".invalid")) {
		throw new Error(
			"[drei] the configured public origin is the Dockerfile build placeholder. Set PUBLIC_URL in the deployment environment.",
		)
	}

	return origin
}

const PUBLIC_ORIGIN = resolvePublicOrigin()

/**
 * Origins already reported as mismatched, so a user hammering a wrong address
 * produces one line per address rather than one per request.
 */
const warnedOrigins = new Set()

/**
 * Warns when a request arrives on an address that is not the configured public
 * origin.
 *
 * better-auth will reject such a request with "Invalid origin", which tells the
 * person looking at the browser nothing about why. This turns the same
 * misconfiguration into a line in the container log naming both addresses.
 */
function warnOnForeignHost(host) {
	if (PUBLIC_ORIGIN === null || host === undefined) {
		return
	}

	let origin

	try {
		origin = new URL(`http://${host}`).origin
	} catch {
		return
	}

	if (origin === PUBLIC_ORIGIN || warnedOrigins.has(origin)) {
		return
	}

	warnedOrigins.add(origin)
	console.warn(
		`[drei] request for ${origin} but the public origin is ${PUBLIC_ORIGIN}: sign-in from ${origin} will be rejected as an invalid origin. Set PUBLIC_URL to the address users actually use.`,
	)
}

/**
 * Optional HTTP Basic credentials required on /git/*.
 *
 * `git` does not send a browser session cookie, so without a credential of its
 * own the backend can only authenticate a session and the practical effect is
 * that pushing is impossible. When these are set this process authenticates
 * /git/* and forwards the identity in X-Drei-Git-User, which the backend trusts
 * because it is only reachable on the internal network.
 */
const GIT_USER = process.env.GIT_BASIC_AUTH_USER ?? ""
const GIT_PASSWORD = process.env.GIT_BASIC_AUTH_PASSWORD ?? ""

const MIME = {
	".avif": "image/avif",
	".css": "text/css; charset=utf-8",
	".gif": "image/gif",
	".html": "text/html; charset=utf-8",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".map": "application/json; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8",
	".webmanifest": "application/manifest+json",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
}

/** Extensions that must 404 rather than fall through to SSR. */
const ASSET_EXTENSIONS = new Set([
	".avif", ".css", ".gif", ".ico", ".jpeg", ".jpg", ".js", ".json", ".map",
	".mjs", ".png", ".svg", ".txt", ".webmanifest", ".webp", ".woff", ".woff2",
])

const backend = new URL(BACKEND_URL)

/** Load the SSR handler once, at boot, so the first request is not slower. */
const { default: ssr } = await import(SERVER_ENTRY)

/* -------------------------------------------------------------------------- */
/* static files                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Resolves a URL path to a file inside the client dist, or null.
 *
 * The resolved path is compared against CLIENT_DIR with a separator so a
 * crafted "../" cannot escape it, and the client's own directory is never
 * served.
 */
function resolveStaticFile(pathname) {
	let decoded

	try {
		decoded = decodeURIComponent(pathname)
	} catch {
		return null
	}

	if (decoded === "" || decoded.endsWith("/")) {
		return null
	}

	if (extname(decoded) === "") {
		return null
	}

	const candidate = resolve(join(CLIENT_DIR, normalize(decoded)))

	if (candidate !== CLIENT_DIR && !candidate.startsWith(CLIENT_DIR + sep)) {
		return null
	}

	try {
		if (statSync(candidate).isFile()) {
			return candidate
		}
	} catch {
		return null
	}

	return null
}

/**
 * Serves a client asset.
 *
 * Vite emits content-hashed filenames under /assets, so those are immutable and
 * safe to cache hard. Everything else in public/ keeps its own name and must be
 * revalidated.
 */
function serveStatic(res, file) {
	const ext = extname(file)
	const immutable = file.includes(`${sep}assets${sep}`)

	res.writeHead(200, {
		"Content-Type": MIME[ext] ?? "application/octet-stream",
		"Content-Length": statSync(file).size,
		"Cache-Control": immutable
			? "public, max-age=31536000, immutable"
			: "public, max-age=0, must-revalidate",
	})

	createReadStream(file).pipe(res)
}

/* -------------------------------------------------------------------------- */
/* /git basic auth                                                            */
/* -------------------------------------------------------------------------- */

/** Constant-time string comparison, so the credential cannot be timed out. */
function safeEqual(a, b) {
	const bufA = Buffer.from(String(a))
	const bufB = Buffer.from(String(b))

	if (bufA.length !== bufB.length) {
		// Still perform a comparison so the cost of a mismatch does not depend
		// on the length of the supplied value.
		timingSafeEqual(bufA, bufA)
		return false
	}

	return timingSafeEqual(bufA, bufB)
}

/**
 * Reports whether a /git/ request is a push rather than a read.
 *
 * Only pushes require the credential. Reads are left to the backend, which
 * already refuses anonymous access to private repositories, so keeping reads
 * open preserves the ability to clone a public repository with a plain
 * `git clone` and no credentials.
 *
 * An unrecognised shape is treated as a push, so a new git service cannot
 * appear and be let through unauthenticated by default.
 */
function isGitPush(pathname, search) {
	if (pathname.endsWith("/git-receive-pack")) {
		return true
	}

	// The packfile half of a clone or fetch. Without this, the fail-closed
	// default below would challenge the POST that follows every ref
	// advertisement, and no clone could ever complete.
	if (
		pathname.endsWith("/git-upload-pack") ||
		pathname.endsWith("/git-upload-archive")
	) {
		return false
	}

	if (pathname.endsWith("/info/refs")) {
		const service = new URLSearchParams(search).get("service")
		return service === "git-receive-pack"
	}

	// Unrecognised: treat as a push so a new git service cannot appear and be
	// let through unauthenticated by default.
	return true
}

/** Writes a 401 with a Basic challenge and returns false. */
function challenge(res) {
	res.writeHead(401, {
		"WWW-Authenticate": 'Basic realm="Drei", charset="UTF-8"',
		"Content-Type": "text/plain; charset=utf-8",
	})
	res.end("authentication required\n")
	return false
}

/**
 * Authenticates a git-over-HTTP request and returns the identity to forward to
 * the backend, or an empty string when the request carries none.
 *
 * Reads are not challenged: the backend already decides who may read what, and
 * leaving reads open keeps `git clone` of a public repository credential-free.
 *
 * The returned identity is only ever non-empty after a successful credential
 * check, so the backend's trust of X-Drei-Git-User cannot be claimed by a
 * request that did not authenticate. That is why the header is not simply
 * stamped on every /git/ request.
 *
 * With no credential configured, a push falls through unidentified and the
 * backend demands a better-auth session, which the git CLI cannot send; that
 * is a deliberate trade for not inventing a token system here.
 */
function authenticateGit(req, res, pathname, search) {
	if (!isGitPush(pathname, search)) {
		return ""
	}

	if (GIT_USER === "" || GIT_PASSWORD === "") {
		return ""
	}

	const header = req.headers.authorization ?? ""

	if (!header.startsWith("Basic ")) {
		challenge(res)
		return null
	}

	let decoded = ""

	try {
		decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
	} catch {
		challenge(res)
		return null
	}

	const colon = decoded.indexOf(":")

	if (colon < 0) {
		challenge(res)
		return null
	}

	if (
		!safeEqual(decoded.slice(0, colon), GIT_USER) ||
		!safeEqual(decoded.slice(colon + 1), GIT_PASSWORD)
	) {
		challenge(res)
		return null
	}

	return GIT_USER
}

/* -------------------------------------------------------------------------- */
/* reverse proxy                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Streams a request through to the backend.
 *
 * Bodies are piped rather than buffered, which matters for git: a push sends a
 * multi-megabyte packfile and buffering it would cost memory and add latency.
 * The original Content-Length is forwarded, and the Go CGI handler rejects
 * chunked request bodies, so buffering must not be introduced here.
 */
function proxy(req, res, pathname, search, extraHeaders) {
	const headers = { ...req.headers, ...extraHeaders }

	// The backend must not see this process's credentials.
	delete headers.authorization
	headers.host = backend.host

	const upstream = httpRequest(
		{
			protocol: backend.protocol,
			hostname: backend.hostname,
			port: backend.port,
			method: req.method,
			path: pathname + search,
			headers,
		},
		(upstreamRes) => {
			res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
			upstreamRes.pipe(res)
		},
	)

	upstream.on("error", (err) => {
		if (res.headersSent) {
			res.destroy()
			return
		}

		res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" })
		res.end(`backend unavailable: ${err.message}\n`)
	})

	req.pipe(upstream)
}

/* -------------------------------------------------------------------------- */
/* SSR bridge                                                                 */
/* -------------------------------------------------------------------------- */

/** Converts a Node request into a Web Request without buffering the body. */
function toWebRequest(req, url) {
	const hasBody = req.method !== "GET" && req.method !== "HEAD"

	return new Request(url, {
		method: req.method,
		headers: req.headers,
		body: hasBody ? Readable.toWeb(req) : undefined,
		// Required by undici whenever the body is a stream.
		...(hasBody ? { duplex: "half" } : {}),
	})
}

/** Writes a Web Response to a Node response, preserving multi-value headers. */
async function sendWebResponse(res, webRes) {
	const headers = {}

	for (const [key, value] of webRes.headers) {
		// set-cookie must keep every value; better-auth relies on it.
		if (key === "set-cookie") continue
		headers[key] = value
	}

	const cookies = webRes.headers.getSetCookie?.() ?? []

	if (cookies.length > 0) {
		headers["set-cookie"] = cookies
	}

	res.writeHead(webRes.status, headers)

	if (!webRes.body) {
		res.end()
		return
	}

	Readable.fromWeb(webRes.body).pipe(res)
}

/* -------------------------------------------------------------------------- */
/* routing                                                                    */
/* -------------------------------------------------------------------------- */

/** Paths under /api that this app serves itself rather than the backend. */
const SELF_ROUTES = ["/api/auth", "/api/memory"]

/** Prefixes owned by the Go backend. */
const BACKEND_PREFIXES = ["/git/", "/uploads/", "/swagger/"]

function route(pathname) {
	if (pathname === "/git" || pathname.startsWith("/git/")) {
		return "git"
	}

	if (
		pathname === "/uploads" ||
		pathname.startsWith("/uploads/") ||
		pathname === "/swagger" ||
		pathname.startsWith("/swagger/")
	) {
		return "backend"
	}

	if (pathname === "/api" || pathname.startsWith("/api/")) {
		for (const own of SELF_ROUTES) {
			if (pathname === own || pathname.startsWith(`${own}/`)) {
				return "self"
			}
		}

		return "backend"
	}

	return "app"
}

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
	const { pathname, search } = url
	const kind = route(pathname)

	warnOnForeignHost(req.headers.host)

	if (kind === "git") {
		// null means the request was challenged and the response is written.
		const identity = authenticateGit(req, res, pathname, search)

		if (identity === null) {
			return
		}

		proxy(req, res, pathname, search, identity ? { "x-drei-git-user": identity } : {})
		return
	}

	if (kind === "backend") {
		proxy(req, res, pathname, search, {})
		return
	}

	const file = resolveStaticFile(pathname)

	if (file) {
		serveStatic(res, file)
		return
	}

	// A missing asset must not fall through to SSR: answering an HTML document
	// for a .js request turns a clear 404 into a confusing module error.
	if (ASSET_EXTENSIONS.has(extname(pathname).toLowerCase())) {
		res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
		res.end("not found\n")
		return
	}

	try {
		const webRes = await ssr.fetch(toWebRequest(req, url))
		await sendWebResponse(res, webRes)
	} catch (err) {
		console.error("[drei] ssr error:", err)

		if (res.headersSent) {
			res.destroy()
			return
		}

		res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
		res.end("internal server error\n")
	}
})

server.listen(PORT, HOST, () => {
	console.log(`[drei] listening on http://${HOST}:${PORT}`)
	console.log(`[drei]   client dist : ${CLIENT_DIR}`)
	console.log(`[drei]   backend     : ${BACKEND_URL}`)
	console.log(
		`[drei]   public      : ${PUBLIC_ORIGIN ?? "(unset: derived from the request)"}`,
	)
	console.log(
		GIT_USER === ""
			? "[drei]   /git auth   : none configured (session only; push will not work)"
			: "[drei]   /git auth   : basic, user configured",
	)
})
