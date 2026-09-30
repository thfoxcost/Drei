import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./config";
import { de } from "./locales/de";
import { en } from "./locales/en";

/**
 * Translations are bundled rather than fetched, so `changeLanguage` resolves
 * synchronously. That is what lets the locale switch repaint without a
 * loading state, and it means the server and the client always have the same
 * resources available.
 */
export const resources = {
	en: { translation: en },
	de: { translation: de },
} as const;

/**
 * Created at module scope and reused on both the server and the client.
 *
 * The active language is deliberately *not* set from per-request state here:
 * the instance always boots at `DEFAULT_LOCALE` so the server-rendered markup
 * and the hydrating client agree. `LocaleProvider` applies the stored locale
 * in a layout effect, before the browser paints.
 */
function createI18n(): I18nInstance {
	const instance = i18next.createInstance();

	void instance.use(initReactI18next).init({
		resources,
		lng: DEFAULT_LOCALE,
		fallbackLng: DEFAULT_LOCALE,
		supportedLngs: [...SUPPORTED_LOCALES],
		nonExplicitSupportedLngs: true,
		defaultNS: "translation",
		// The classic string-key API. Selectors are opt-in and unnecessary at
		// this catalog size.
		enableSelector: false,
		interpolation: {
			// The app renders translated copy into React children, so escaping
			// would turn quotes into entities.
			escapeValue: false,
		},
		react: {
			useSuspense: false,
		},
	});

	return instance;
}

export const i18n: I18nInstance = createI18n();

export default i18n;
