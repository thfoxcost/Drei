const DEFAULT_BACKEND_URL = "http://localhost:3200";

/**
 * Browser-facing backend base URL. Falls back to the local dev default when
 * `VITE_BACKEND_URL` is unset (e.g. no `.env.development` file), so uploads,
 * downloads, and file links never become `"undefined/..."` URLs.
 */
export function backendUrl(): string {
	const raw = import.meta.env.VITE_BACKEND_URL as string | undefined;
	const base = raw?.trim().replace(/\/+$/, "");
	return base && base.length > 0 ? base : DEFAULT_BACKEND_URL;
}

/**
 * Builds a fully-qualified uploads URL for a stored relative path such as
 * `orgs/my-org.png`. Absolute URLs pass through untouched; nullish paths
 * return null so callers can render their fallback.
 */
export function uploadsUrl(path: string | null | undefined): string | null {
	if (!path) return null;
	if (/^https?:\/\//.test(path)) return path;
	return `${backendUrl()}/uploads/${path.replace(/^\/+/, "")}`;
}
