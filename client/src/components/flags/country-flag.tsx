import type { CSSProperties } from "react";
import ReactCountryFlag from "react-country-flag";
import { ArabWorldFlag } from "./arab-world-flag";

/**
 * Non-ISO code used for the "Arab World" entry in the countries list.
 * `react-country-flag` cannot render it, so `CountryFlag` renders the custom
 * `ArabWorldFlag` SVG instead.
 */
export const ARAB_WORLD_COUNTRY_CODE = "ARB";

type CountryFlagProps = {
	countryCode: string;
	style?: CSSProperties;
	className?: string;
};

/**
 * Renders a country flag for an entry in the countries list.
 * Falls back to the custom Arab world flag SVG for codes that
 * `react-country-flag` does not support.
 */
export function CountryFlag({
	countryCode,
	style,
	className,
}: CountryFlagProps) {
	if (countryCode === ARAB_WORLD_COUNTRY_CODE) {
		return <ArabWorldFlag className={className} style={style} />;
	}

	return <ReactCountryFlag countryCode={countryCode} svg style={style} />;
}
