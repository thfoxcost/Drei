import { de, enUS } from "date-fns/locale";
import i18next from "i18next";

import { i18n } from "../i18n";

/**
 * date-fns locales for the UI languages. `Intl` handles the runtime locale
 * list; date-fns needs an explicit object, so this map is the bridge.
 */
const DATE_FNS_LOCALES = {
	de,
	en: enUS,
} as const;

export type UiLocale = keyof typeof DATE_FNS_LOCALES;

/**
 * The active UI locale, normalised to a `date-fns` locale key.
 *
 * Read from the i18next instance rather than a React context so the shared
 * formatting helpers stay usable from hooks, data loaders and plain functions
 * that have no access to providers.
 */
export function currentLocale(): UiLocale {
	const lng = i18n.language ?? i18next.language;
	return lng === "de" ? "de" : "en";
}

export function dateFnsLocale(): (typeof DATE_FNS_LOCALES)[UiLocale] {
	return DATE_FNS_LOCALES[currentLocale()];
}

/** BCP-47 tag for `Intl` APIs. */
export function intlLocale(): string {
	return currentLocale() === "de" ? "de-DE" : "en-US";
}

/** Locale-aware thousands/decimal grouping. */
export function formatNumber(value: number): string {
	return value.toLocaleString(intlLocale());
}

/**
 * Locale-aware relative time, e.g. "3 years ago" / "vor 3 Jahren".
 *
 * `numeric: "auto"` is what yields the natural "yesterday" / "gestern" forms
 * instead of "1 day ago".
 */
export function formatRelative(
	value: number,
	unit: Intl.RelativeTimeFormatUnit,
): string {
	return new Intl.RelativeTimeFormat(intlLocale(), { numeric: "auto" }).format(
		value,
		unit,
	);
}

/** Locale-aware short date, e.g. "Jul 23, 2026" / "23.07.2026". */
export function formatShortDate(
	date: Date,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
	},
): string {
	return date.toLocaleDateString(intlLocale(), options);
}

/** Locale-aware date + time, e.g. "Jul 23, 2026, 11:25 AM" / "23.07.2026, 11:25". */
export function formatDateTime(date: Date): string {
	return date.toLocaleString(intlLocale());
}

/** Locale-aware month label for the contribution heatmap axis. */
export function formatMonthLabel(
	date: Date,
	month: "short" | "long" = "short",
): string {
	return date.toLocaleDateString(intlLocale(), { month });
}

/** Locale-aware weekday label for the contribution heatmap header. */
export function formatWeekdayLabel(date: Date): string {
	return date.toLocaleDateString(intlLocale(), { weekday: "short" });
}

/**
 * Locale-aware byte size. Unit abbreviations differ between English and German
 * (`KB` vs. `KB`, `B` vs. `B`), so the unit table is translated rather than
 * hardcoded, while the numeric part is locale-grouped.
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return i18n.t("common.units.zeroBytes") as string;

	const units = ["B", "KB", "MB", "GB"] as const;
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = bytes / 1024 ** i;
	const formatted = formatNumber(
		Number(value.toFixed(value >= 100 || i === 0 ? 0 : 1)),
	);

	return `${formatted} ${i18n.t(`common.units.${units[i]}`) as string}`;
}
