import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "drei:heatmap-year";
const EVENT_NAME = "drei:heatmap-year-change";

export function getCurrentYear(): number {
	return new Date().getFullYear();
}

function readStoredYear(): number {
	const fallback = getCurrentYear();

	try {
		const raw = localStorage.getItem(STORAGE_KEY);

		if (raw !== null) {
			const parsed = Number.parseInt(raw, 10);

			if (Number.isFinite(parsed) && parsed >= 1970 && parsed <= 2100) {
				return parsed;
			}
		}
	} catch {
		// Storage unavailable (SSR / private mode): fall through to current year.
	}

	return fallback;
}

/**
 * Shared contribution-heatmap year. Persisted to localStorage so the heatmap
 * on the home and profile pages agrees with the Appearance setting, and
 * broadcast live so already-mounted heatmaps update without a reload.
 * Defaults to the current year. SSR-safe: storage is only touched in effects
 * and event handlers.
 */
export function useHeatmapYear() {
	const [year, setYearState] = useState<number>(() => getCurrentYear());

	useEffect(() => {
		setYearState(readStoredYear());

		const onChange = (event: Event) => {
			setYearState((event as CustomEvent<number>).detail);
		};

		window.addEventListener(EVENT_NAME, onChange);
		return () => window.removeEventListener(EVENT_NAME, onChange);
	}, []);

	const setYear = useCallback((next: number) => {
		setYearState(next);

		try {
			localStorage.setItem(STORAGE_KEY, String(next));
		} catch {
			// Storage unavailable: in-memory state still updates.
		}

		window.dispatchEvent(new CustomEvent<number>(EVENT_NAME, { detail: next }));
	}, []);

	return [year, setYear] as const;
}
