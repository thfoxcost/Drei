import { useTranslation } from "react-i18next";

("use client");

import {
	CircleDot,
	GitCommit,
	GitPullRequest,
	type LucideIcon,
} from "lucide-react";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface ActivityDatum {
	activity: string;
	value: number;
	icon: LucideIcon;
}

interface ActivityRadarChartProps {
	commitCount?: number;
	issueCount?: number;
	prCount?: number;
}

export function ActivityRadarChart({
	commitCount = 0,
	issueCount = 0,
	prCount = 0,
}: ActivityRadarChartProps) {
	const { t } = useTranslation();

	const chartConfig = {
		value: {
			label: t("repo.charts.activity"),
			color: "#22c55e",
		},
	} satisfies ChartConfig;

	const chartData: ActivityDatum[] = [
		{ activity: t("repo.charts.commits"), value: commitCount, icon: GitCommit },
		{ activity: t("repo.charts.prs"), value: prCount, icon: GitPullRequest },
		{ activity: t("repo.charts.issues"), value: issueCount, icon: CircleDot },
	];
	return (
		<div className="w-full">
			<ChartContainer config={chartConfig} className="mx-auto h-56 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<RadarChart data={chartData} outerRadius="75%">
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>

						<PolarGrid />

						<PolarAngleAxis
							dataKey="activity"
							tick={({ x, y, payload }) => (
								<text
									x={x}
									y={y}
									textAnchor="middle"
									dominantBaseline="central"
									className="fill-muted-foreground text-xs"
								>
									{payload.value}
								</text>
							)}
						/>

						<PolarRadiusAxis tick={false} axisLine={false} />

						<Radar
							dataKey="value"
							stroke="#22c55e"
							fill="#22c55e"
							fillOpacity={0.25}
							strokeWidth={2}
							dot={{
								r: 4,
								fill: "#22c55e",
								stroke: "#22c55e",
							}}
						/>
					</RadarChart>
				</ResponsiveContainer>
			</ChartContainer>
		</div>
	);
}
