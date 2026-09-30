import { i18n } from "../i18n";

/** The JSON envelope every error endpoint returns. */
export type ApiErrorBody = {
	success?: boolean;
	/** Stable identifier emitted by `writeErrorCoded` on the Go side. */
	code?: unknown;
	/** Human-readable English fallback. */
	error?: unknown;
	/** Some success-shaped responses still use `message` for the failure text. */
	message?: unknown;
};

/** The key type i18next accepts for `t()`. */
type TKey = Parameters<typeof i18n.t>[0];

function asString(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Looks a key up in the active catalog, returning `null` when it is absent.
 *
 * `exists` is what makes this safe for the code paths where a key is built at
 * runtime: unknown codes are the norm for raw technical failures (the Go side
 * emits `ErrCodeUnknown` for `err.Error()` passthroughs), so returning `null`
 * lets the caller fall back instead of rendering the key itself.
 */
function translateKey(key: string): string | null {
	if (!i18n.exists(key)) return null;
	return i18n.t(key as TKey) as unknown as string;
}

/**
 * The single place backend failures become user-facing text.
 *
 * Components must never translate a backend message themselves; they call this
 * so the code -> key mapping stays in one file. Resolution order:
 *
 *   1. `code` (ours)        -> `errors.code.<code>`
 *   2. `code` (better-auth) -> `errors.auth.<CODE>`
 *   3. the English `error` / `message` field, verbatim
 *   4. `errors.generic.unknown`
 *
 * Step 3 is what keeps uncoded technical errors (raw Postgres or git messages)
 * from being presented as if they were translatable product copy: they are
 * passed through only because there is nothing better to show.
 */
export function apiErrorMessage(
	body: ApiErrorBody | null | undefined,
	opts: { fallbackKey?: string } = {},
): string {
	const code = asString(body?.code);

	if (code) {
		const translated =
			translateKey(`errors.code.${code}`) ??
			translateKey(`errors.auth.${code}`);

		if (translated) return translated;
	}

	// Uncoded: prefer our own generic wording over raw backend text when the
	// caller supplied one.
	if (opts.fallbackKey) return translateKey(opts.fallbackKey) ?? code ?? "";

	const raw = asString(body?.error) ?? asString(body?.message);
	if (raw) return raw;

	return translateKey("errors.generic.unknown") ?? "Something went wrong";
}

/**
 * Same resolution as {@link apiErrorMessage} but for a thrown/rejected value,
 * which is how most React Query mutations surface failures.
 */
export function apiErrorMessageFromThrown(
	err: unknown,
	opts: { fallbackKey?: string } = {},
): string {
	if (err && typeof err === "object") {
		const asApiError = err as ApiErrorBody;
		if (asApiError.code !== undefined) {
			return apiErrorMessage(asApiError, opts);
		}
	}

	if (opts.fallbackKey) {
		const fromKey = translateKey(opts.fallbackKey);
		if (fromKey) return fromKey;
	}

	if (err instanceof Error && err.message) return err.message;

	return apiErrorMessage(null);
}

/**
 * Maps a better-auth `APIError` to a translated message. better-auth exposes a
 * stable UPPER_SNAKE_CASE `body.code`, so no string matching is needed.
 */
export function authErrorMessage(
	err: unknown,
	opts: { fallbackKey?: string } = {},
): string {
	const code =
		err && typeof err === "object"
			? asString((err as { body?: { code?: unknown } }).body?.code)
			: null;

	if (code) {
		const translated = translateKey(`errors.auth.${code}`);
		if (translated) return translated;
	}

	if (opts.fallbackKey) return translateKey(opts.fallbackKey) ?? "";

	if (err instanceof Error && err.message) return err.message;

	return translateKey("errors.auth.UNKNOWN") ?? "Something went wrong";
}
