import "i18next";
import type { resources } from "./i18n";

/**
 * Teaches i18next the shape of our catalog so `t()` is type-checked: an unknown
 * key, a missing interpolation variable, or a key that only exists in the
 * English catalog is a compile error rather than a runtime fallback.
 */
declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: (typeof resources)["en"];
	}
}
