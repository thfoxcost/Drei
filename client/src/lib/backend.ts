/**
 * Backend origin helpers.
 *
 * The Go backend and this client are served from the same origin behind a
 * reverse proxy, which is what makes the session cookie work: a same-origin
 * request carries it automatically, so no call site needs
 * `credentials: "include"` and there is no cross-origin CORS surface at all.
 *
 * Consequently:
 *
 *   - API and upload requests are origin-relative. They are written as plain
 *     "/api/..." and "/uploads/..." literals and need no helper.
 *   - URLs that leave the browser - a git clone URL, which is typed into a
 *     terminal - must be absolute, and are built from VITE_PUBLIC_URL.
 */

/** Trailing slashes are stripped so joining never produces a double slash. */
function normalizeOrigin(origin: string): string {
	return origin.replace(/\/+$/, "");
}

/**
 * The public origin of this deployment, without a trailing slash.
 *
 * VITE_PUBLIC_URL is the address a user or a terminal can reach. It is
 * deliberately separate from the backend's own listening address: the backend
 * port is not exposed, only the reverse proxy in front of it.
 *
 * In development and in the default production build this is unset, in which
 * case the browser's own origin is used. That is the correct answer for a
 * same-origin setup, and it keeps clone URLs correct when the app is reached by
 * a LAN address, a VPN hostname or a domain without a rebuild.
 */
export function publicOrigin(): string {
	const configured = import.meta.env.VITE_PUBLIC_URL as string | undefined;
	if (configured && configured.length > 0) {
		return normalizeOrigin(configured);
	}

	if (typeof window !== "undefined" && window.location) {
		return normalizeOrigin(window.location.origin);
	}

	return "";
}

/**
 * Builds the git-over-HTTP clone URL for a repository.
 *
 * Shape: <public-origin>/git/<owner>/<repo>.git
 *
 * The owner and repository are encoded because they come from the URL path.
 * The example is written with placeholders rather than a literal address so it
 * does not end up in the built bundle and confuse a later origin audit.
 */
export function publicGitUrl(owner: string, repo: string): string {
	return `${publicOrigin()}/git/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}.git`;
}
