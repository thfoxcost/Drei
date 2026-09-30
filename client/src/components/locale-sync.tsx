import { useEffect, useRef } from "react";

import { useAppearanceSettings } from "#/hooks/useAppearanceSettings";
import { LOCALE_STORAGE_KEY, resolveLocale } from "#/i18n/config";
import { useLocale } from "#/i18n/locale-provider";

function readStoredLocale(): string | null {
	if (typeof window === "undefined") return null;

	try {
		return window.localStorage.getItem(LOCALE_STORAGE_KEY);
	} catch {
		return null;
	}
}

/**
 * Reconciles the active locale with the account-wide preference.
 *
 * The language is stored in two places: `localStorage`, which the
 * `LocaleProvider` reads pre-paint so the very first frame is already correct,
 * and the `appearance_language` column, which follows the account across
 * devices. This component closes the gap: when the server value differs from
 * what this browser has cached, the server wins.
 *
 * It renders nothing and only ever corrects a mismatch, so the common case
 * (both agree) causes no re-render and no visible language change.
 */
export function LocaleSync() {
	const { data } = useAppearanceSettings();
	const { locale, setLocale } = useLocale();
	const applied = useRef(false);

	useEffect(() => {
		if (applied.current) return;
		if (!data?.language) return;

		const server = resolveLocale(data.language);

		applied.current = true;

		// Already in sync (the common case): leave everything untouched.
		if (server === locale && server === resolveLocale(readStoredLocale())) {
			return;
		}

		setLocale(server);
	}, [data?.language, locale, setLocale]);

	return null;
}
