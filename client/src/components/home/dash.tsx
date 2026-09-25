import { useEffect, useState } from "react";

import {
	HeatmapCalendar,
	type HeatmapDatum,
} from "#/components/heatmap-calendar.tsx";
import { Spinner } from "#/components/ui/spinner.tsx";
import { useHeatmapYear } from "#/hooks/useHeatmapYear";
import { authClient } from "#/lib/auth-client";
import { getContributions } from "#/lib/contributions";

function Dash({ username }: { username?: string }) {
	const { data: session } = authClient.useSession();
	const resolvedUsername = username ?? session?.user?.name ?? "";
	const [year] = useHeatmapYear();
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
					err instanceof Error ? err.message : "Failed to load contributions",
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
					renderTooltip={(cell) => (
						<div className="text-sm">
							<div className="font-medium">
								{cell.value} contribution{cell.value === 1 ? "" : "s"}
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
