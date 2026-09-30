import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	HeatmapCalendar,
	type HeatmapDatum,
} from "#/components/heatmap-calendar.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { useHeatmapYear } from "#/hooks/useHeatmapYear";
import { useProfileHeatmapPalette } from "#/hooks/useProfileHeatmap";
import { i18n } from "#/i18n/i18n";
import { authClient } from "#/lib/auth-client";
import { getContributions } from "#/lib/contributions";

function Dash({ username }: { username?: string }) {
	const { t } = useTranslation();

	const { data: session } = authClient.useSession();
	const resolvedUsername = username ?? session?.user?.name ?? "";
	const [year] = useHeatmapYear();
	const palette = useProfileHeatmapPalette(resolvedUsername);
	const [data, setData] = useState<HeatmapDatum[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!resolvedUsername) {
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

		getContributions(resolvedUsername, year)
			.then((res) => {
				if (cancelled) return;
				setData(res.contributions);
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				setError(
					err instanceof Error
						? err.message
						: i18n.t("dashboard.contributions.loadFailed"),
				);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [resolvedUsername, year]);

	if (!resolvedUsername) return null;

	return (
		<div className="w-full">
			{loading ? (
				<div className="flex h-40.5 w-full items-center justify-center">
					<Spinner className="text-muted-foreground" />
				</div>
			) : error ? (
				<div className="flex h-40.5 w-full items-center justify-center text-sm text-muted-foreground">
					{error}
				</div>
			) : (
				<HeatmapCalendar
					data={data}
					year={year}
					axisLabels
					legend={false}
					palette={palette}
					thresholds={[0, 1, 2, 3, 5]}
					renderTooltip={(cell) => (
						<div className="text-sm">
							<div className="font-medium">
								{t("dashboard.contributions.label", { count: cell.value })}
							</div>
							<div className="text-muted-foreground">{cell.label}</div>
						</div>
					)}
				/>
			)}
		</div>
	);
}

export default Dash;
