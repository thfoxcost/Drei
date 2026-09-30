import { ScriptOnce } from "@tanstack/react-router";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";

import {
	DEFAULT_LOCALE,
	LOCALE_STORAGE_KEY,
	type Locale,
	resolveLocale,
	SUPPORTED_LOCALES,
} from "./config";
import { i18n } from "./i18n";

/**
 * `useLayoutEffect` warns during SSR because there is nothing to lay out.
 * This alias keeps the hook call order stable between server and client.
 */
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

function readStoredLocale(): Locale {
	if (typeof window === "undefined") return DEFAULT_LOCALE;

	try {
		return resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
	} catch {
		return DEFAULT_LOCALE;
	}
}

function persistLocale(locale: Locale) {
	if (typeof window === "undefined") return;

	try {
		window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	} catch {
		// Private-mode or quota errors are not worth surfacing.
	}
}

function applyDocumentLang(locale: Locale) {
	if (typeof document === "undefined") return;
	document.documentElement.lang = locale;
}

/**
 * Pre-paint script, the same technique `theme-provider.tsx` uses to avoid a
 * flash of the wrong theme. It stamps `<html lang>` before React hydrates so
 * screen readers, hyphenation and the browser's own translation prompt see the
 * right language from the very first frame.
 */
function getLocaleScript(): string {
	const key = JSON.stringify(LOCALE_STORAGE_KEY);
	const locales = JSON.stringify(SUPPORTED_LOCALES);

	return `(function(){try{var v=localStorage.getItem(${key});if(v){v=String(v).split(/[-_]/)[0].toLowerCase();if(${locales}.indexOf(v)>-1){document.documentElement.lang=v}}}catch(e){}})();`;
}

type LocaleContextValue = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
};

const localeContext = createContext<LocaleContextValue>({
	locale: DEFAULT_LOCALE,
	setLocale: () => {},
});

type LocaleProviderProps = {
	children: React.ReactNode;
};

/**
 * Owns the active locale.
 *
 * The initial render always uses `DEFAULT_LOCALE` so it matches the
 * server-rendered HTML; the stored locale is applied in a layout effect, which
 * runs before the browser paints. Switching languages therefore repaints the
 * whole app immediately, with no reload and no intermediate empty state.
 */
export function LocaleProvider({ children }: LocaleProviderProps) {
	const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

	useIsomorphicLayoutEffect(() => {
		const stored = readStoredLocale();

		if (stored !== i18n.language) {
			void i18n.changeLanguage(stored);
		}

		applyDocumentLang(stored);
		setLocaleState(stored);
		// Intentionally mount-only: later changes go through `setLocale`, and
		// the cross-device case is handled by <LocaleSync />.
	}, []);

	const setLocale = useCallback((next: Locale) => {
		persistLocale(next);
		applyDocumentLang(next);
		setLocaleState(next);
		void i18n.changeLanguage(next);
	}, []);

	return (
		<localeContext.Provider value={{ locale, setLocale }}>
			<ScriptOnce>{getLocaleScript()}</ScriptOnce>
			{children}
		</localeContext.Provider>
	);
}

/** The active locale plus a setter that persists and repaints immediately. */
export function useLocale(): LocaleContextValue {
	return useContext(localeContext);
}
