/**
 * Locale configuration for the application.
 *
 * `SUPPORTED_LOCALES` is the single source of truth and must stay in sync with
 * `validLanguages` in `backend/internal/handlers/appearance.go`, which
 * validates the `language` field of `PUT /api/user/appearance`.
 */
export const SUPPORTED_LOCALES = ["en", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Endonyms shown in the language picker. A language is always named in its own
 * language, so these are never themselves translated.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
	en: "🇬🇧 English",
	de: "🇩🇪 Deutsch",
};

/**
 * Languages that are announced in the picker but not yet selectable. They are
 * rendered as disabled options and are deliberately absent from
 * `SUPPORTED_LOCALES` so neither the client nor the server accepts them.
 */
export const UPCOMING_LOCALES = [
	{ code: "ar", label: "🇵🇸 العربية" },
	{ code: "fr", label: "🇫🇷 Français" },
] as const;

/** localStorage key mirroring the server-persisted `appearance_language`. */
export const LOCALE_STORAGE_KEY = "drei:locale";

export function isLocale(value: unknown): value is Locale {
	return (
		typeof value === "string" &&
		(SUPPORTED_LOCALES as readonly string[]).includes(value)
	);
}

/**
 * Coerces an arbitrary locale-ish value to a supported locale.
 *
 * Handles the `Accept-Language` shapes a browser or the API can hand us
 * (`"de"`, `"de-DE"`, `"de_DE"`, `"DE"`) and falls back to the default locale so
 * callers never have to deal with an unsupported code.
 */
export function resolveLocale(value: unknown): Locale {
	if (isLocale(value)) return value;

	if (typeof value === "string") {
		const base = value.trim().replace("_", "-").split("-")[0]?.toLowerCase();
		if (isLocale(base)) return base;
	}

	return DEFAULT_LOCALE;
}
