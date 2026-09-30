import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useUsers } from "#/hooks/useUsers";
import { i18n } from "#/i18n/i18n";
import { authClient } from "#/lib/auth-client";
import { backendUrl } from "#/lib/backend-url";

const SAMPLE_SIZE = 48;
const MIN_ALPHA = 128;

const colorCache = new Map<string, string | null>();

function toHex(r: number, g: number, b: number): string {
	const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
	return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () =>
			reject(new Error(i18n.t("errors.client.colorSampleFailed") as string));
		img.src = src;
	});
}

/**
 * Samples an image down to a tiny canvas and returns the dominant color as
 * hex. Buckets are scored by pixel count weighted with saturation so vivid
 * tones win over flat white/black backgrounds. Null when the image cannot
 * be read (network, CORS, decode failure).
 */
async function sampleDominantColor(imageUrl: string): Promise<string | null> {
	// Fetch as a blob first: blob: URLs are same-origin for canvas, so
	// reading pixels never taints regardless of the image host's CORS.
	const res = await fetch(imageUrl);
	if (!res.ok) return null;
	const blob = await res.blob();
	const objectUrl = URL.createObjectURL(blob);

	try {
		const img = await loadImage(objectUrl);
		const canvas = document.createElement("canvas");
		canvas.width = SAMPLE_SIZE;
		canvas.height = SAMPLE_SIZE;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return null;

		const scale = Math.min(
			SAMPLE_SIZE / img.naturalWidth,
			SAMPLE_SIZE / img.naturalHeight,
		);
		const w = Math.max(1, Math.floor(img.naturalWidth * scale));
		const h = Math.max(1, Math.floor(img.naturalHeight * scale));
		ctx.drawImage(img, 0, 0, w, h);

		const { data } = ctx.getImageData(0, 0, w, h);

		const buckets = new Map<number, { count: number; score: number }>();
		for (let i = 0; i < data.length; i += 16) {
			const a = data[i + 3];
			if (a < MIN_ALPHA) continue;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			// Skip near-white and near-black: usually backgrounds, not the subject.
			if (r > 240 && g > 240 && b > 240) continue;
			if (r < 15 && g < 15 && b < 15) continue;

			const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			const saturation = max === 0 ? 0 : (max - min) / max;

			const entry = buckets.get(key) ?? { count: 0, score: 0 };
			entry.count += 1;
			entry.score += 0.35 + saturation;
			buckets.set(key, entry);
		}

		let bestKey: number | null = null;
		let bestScore = 0;
		for (const [key, entry] of buckets) {
			if (entry.score > bestScore) {
				bestScore = entry.score;
				bestKey = key;
			}
		}

		if (bestKey === null) return null;
		const r = ((bestKey >> 10) & 0x7) * 32 + 16;
		const g = ((bestKey >> 5) & 0x7) * 32 + 16;
		const b = (bestKey & 0x7) * 32 + 16;
		return toHex(r, g, b);
	} catch {
		return null;
	} finally {
		URL.revokeObjectURL(objectUrl);
	}
}

/**
 * Returns the dominant color of an image URL as hex, or null while loading
 * / when unavailable. Results are cached per URL for the session.
 */
export function useDominantColor(
	imageUrl: string | null | undefined,
): string | null {
	const [color, setColor] = useState<string | null>(() =>
		imageUrl ? (colorCache.get(imageUrl) ?? null) : null,
	);

	useEffect(() => {
		if (!imageUrl || typeof document === "undefined") {
			setColor(null);
			return;
		}

		if (colorCache.has(imageUrl)) {
			setColor(colorCache.get(imageUrl) ?? null);
			return;
		}

		let cancelled = false;
		setColor(null);

		sampleDominantColor(imageUrl).then((sampled) => {
			if (cancelled) return;
			colorCache.set(imageUrl, sampled);
			setColor(sampled);
		});

		return () => {
			cancelled = true;
		};
	}, [imageUrl]);

	return color;
}

/**
 * Builds a 6-step heatmap palette from a dominant hex color. Level 0 stays
 * theme-aware via `var(--muted)`; higher levels mix the color in so the
 * heatmap adapts to light and dark mode automatically.
 */
export function heatmapPaletteFromColor(hex: string): string[] {
	return [
		"var(--muted)",
		`color-mix(in srgb, ${hex} 38%, var(--muted))`,
		`color-mix(in srgb, ${hex} 55%, var(--muted))`,
		`color-mix(in srgb, ${hex} 70%, var(--muted))`,
		`color-mix(in srgb, ${hex} 85%, var(--muted))`,
		hex,
	];
}

function useHeatmapProfileColorEnabled(): boolean {
	const { data } = useQuery({
		queryKey: ["appearance", "heatmap-profile-color"],
		queryFn: async (): Promise<boolean> => {
			const res = await fetch(`${backendUrl()}/api/user/appearance`, {
				credentials: "include",
			});
			if (!res.ok) return false;
			const json = await res.json();
			return json.heatmapProfileColor === true;
		},
		staleTime: 60_000,
		retry: false,
	});

	return data === true;
}

/**
 * Resolves the heatmap palette for a profile heatmap: when the viewer has
 * enabled "profile color" in Appearance and the profile owner's picture
 * yields a dominant color, returns shades of it — otherwise undefined so
 * the heatmap keeps its default palette.
 */
export function useProfileHeatmapPalette(
	username: string,
): string[] | undefined {
	const { data: session } = authClient.useSession();
	const { data: users = [] } = useUsers();
	const enabled = useHeatmapProfileColorEnabled();

	const sessionName = session?.user?.name ?? "";
	const image =
		sessionName !== "" && sessionName.toLowerCase() === username.toLowerCase()
			? (session?.user?.image ?? null)
			: (users.find((u) => u.username.toLowerCase() === username.toLowerCase())
					?.avatar ?? null);

	const color = useDominantColor(enabled ? image : null);

	if (!enabled || !color) return undefined;
	return heatmapPaletteFromColor(color);
}
