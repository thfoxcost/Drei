import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { createFileRoute } from "@tanstack/react-router";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "#/components/ui/chart";

export const Route = createFileRoute(
	"/$username/$repo/insight/recent-commits",
)({
	component: RouteComponent,
});

const chartData = [
	{ date: "2026-06-01", commits: 12 },
	{ date: "2026-06-02", commits: 7 },
	{ date: "2026-06-03", commits: 18 },
	{ date: "2026-06-04", commits: 4 },
	{ date: "2026-06-05", commits: 9 },
	{ date: "2026-06-06", commits: 15 },
	{ date: "2026-06-07", commits: 6 },
	{ date: "2026-06-08", commits: 21 },
	{ date: "2026-06-09", commits: 13 },
	{ date: "2026-06-10", commits: 8 },
	{ date: "2026-06-11", commits: 17 },
	{ date: "2026-06-12", commits: 11 },
	{ date: "2026-06-13", commits: 5 },
	{ date: "2026-06-14", commits: 19 },
	{ date: "2026-06-15", commits: 14 },
	{ date: "2026-06-16", commits: 23 },
	{ date: "2026-06-17", commits: 16 },
	{ date: "2026-06-18", commits: 10 },
	{ date: "2026-06-19", commits: 7 },
	{ date: "2026-06-20", commits: 12 },
	{ date: "2026-06-21", commits: 20 },
	{ date: "2026-06-22", commits: 9 },
	{ date: "2026-06-23", commits: 15 },
	{ date: "2026-06-24", commits: 18 },
	{ date: "2026-06-25", commits: 11 },
	{ date: "2026-06-26", commits: 24 },
	{ date: "2026-06-27", commits: 8 },
	{ date: "2026-06-28", commits: 17 },
	{ date: "2026-06-29", commits: 13 },
	{ date: "2026-06-30", commits: 21 },

	{ date: "2026-07-01", commits: 16 },
	{ date: "2026-07-02", commits: 9 },
	{ date: "2026-07-03", commits: 27 },
	{ date: "2026-07-04", commits: 6 },
	{ date: "2026-07-05", commits: 14 },
	{ date: "2026-07-06", commits: 22 },
	{ date: "2026-07-07", commits: 11 },
	{ date: "2026-07-08", commits: 19 },
	{ date: "2026-07-09", commits: 8 },
	{ date: "2026-07-10", commits: 25 },
	{ date: "2026-07-11", commits: 13 },
	{ date: "2026-07-12", commits: 18 },
	{ date: "2026-07-13", commits: 7 },
	{ date: "2026-07-14", commits: 29 },
	{ date: "2026-07-15", commits: 15 },
	{ date: "2026-07-16", commits: 21 },
	{ date: "2026-07-17", commits: 12 },
	{ date: "2026-07-18", commits: 26 },
	{ date: "2026-07-19", commits: 10 },
	{ date: "2026-07-20", commits: 17 },
	{ date: "2026-07-21", commits: 23 },
	{ date: "2026-07-22", commits: 9 },
	{ date: "2026-07-23", commits: 20 },
	{ date: "2026-07-24", commits: 14 },
	{ date: "2026-07-25", commits: 28 },
	{ date: "2026-07-26", commits: 11 },
	{ date: "2026-07-27", commits: 19 },
	{ date: "2026-07-28", commits: 7 },
	{ date: "2026-07-29", commits: 24 },
	{ date: "2026-07-30", commits: 16 },
	{ date: "2026-07-31", commits: 22 },

	{ date: "2026-08-01", commits: 13 },
	{ date: "2026-08-02", commits: 8 },
	{ date: "2026-08-03", commits: 26 },
	{ date: "2026-08-04", commits: 15 },
	{ date: "2026-08-05", commits: 31 },
	{ date: "2026-08-06", commits: 12 },
	{ date: "2026-08-07", commits: 20 },
	{ date: "2026-08-08", commits: 9 },
	{ date: "2026-08-09", commits: 27 },
	{ date: "2026-08-10", commits: 18 },
	{ date: "2026-08-11", commits: 14 },
	{ date: "2026-08-12", commits: 23 },
	{ date: "2026-08-13", commits: 10 },
	{ date: "2026-08-14", commits: 29 },
	{ date: "2026-08-15", commits: 16 },
	{ date: "2026-08-16", commits: 21 },
	{ date: "2026-08-17", commits: 7 },
	{ date: "2026-08-18", commits: 25 },
	{ date: "2026-08-19", commits: 13 },
	{ date: "2026-08-20", commits: 30 },
	{ date: "2026-08-21", commits: 18 },
	{ date: "2026-08-22", commits: 11 },
	{ date: "2026-08-23", commits: 24 },
	{ date: "2026-08-24", commits: 15 },
	{ date: "2026-08-25", commits: 28 },
	{ date: "2026-08-26", commits: 9 },
	{ date: "2026-08-27", commits: 22 },
	{ date: "2026-08-28", commits: 17 },
	{ date: "2026-08-29", commits: 26 },
	{ date: "2026-08-30", commits: 12 },
	{ date: "2026-08-31", commits: 19 },

	{ date: "2026-09-01", commits: 14 },
	{ date: "2026-09-02", commits: 7 },
	{ date: "2026-09-03", commits: 18 },
	{ date: "2026-09-04", commits: 11 },
	{ date: "2026-09-05", commits: 24 },
	{ date: "2026-09-06", commits: 16 },
	{ date: "2026-09-07", commits: 9 },
	{ date: "2026-09-08", commits: 27 },
	{ date: "2026-09-09", commits: 13 },
	{ date: "2026-09-10", commits: 21 },
	{ date: "2026-09-11", commits: 8 },
	{ date: "2026-09-12", commits: 19 },
	{ date: "2026-09-13", commits: 12 },
	{ date: "2026-09-14", commits: 30 },
	{ date: "2026-09-15", commits: 17 },
	{ date: "2026-09-16", commits: 25 },
	{ date: "2026-09-17", commits: 16 },
	{ date: "2026-09-18", commits: 10 },
	{ date: "2026-09-19", commits: 22 },
	{ date: "2026-09-20", commits: 14 },
	{ date: "2026-09-21", commits: 28 },
	{ date: "2026-09-22", commits: 9 },
	{ date: "2026-09-23", commits: 17 },
	{ date: "2026-09-24", commits: 23 },
	{ date: "2026-09-25", commits: 31 },
];

const chartConfig = {
	commits: {
		label: "Commits",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function RouteComponent() {
	const total = React.useMemo(
		() => ({
			commits: chartData.reduce((acc, curr) => acc + curr.commits, 0),
		}),
		[],
	);

	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				Recent commits for ncdai/chanhdai.com
			</span>

			<div className="overflow-hidden rounded-md border">
				<div className="flex flex-col items-stretch border-b sm:flex-row">
					<div className="flex flex-1 flex-col justify-center gap-1 bg-accent/40 px-6 py-4">
						<span className="font-medium">Recent Commits</span>
						<span className="text-sm text-muted-foreground">
							Showing commits over the last 24 days
						</span>
					</div>

					<div className="flex border-t sm:border-t-0 sm:border-l">
						<div className="flex min-w-32 flex-col justify-center gap-1 px-6 py-4">
							<span className="text-xs text-muted-foreground">
								Total commits
							</span>
							<span className="text-lg font-bold sm:text-3xl">
								{total.commits.toLocaleString()}
							</span>
						</div>
					</div>
				</div>

				<div className="px-2 py-6 sm:p-6">
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[300px] w-full"
					>
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{
								left: 12,
								right: 12,
							}}
						>
							<CartesianGrid vertical={false} />

							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={(value) => {
									const date = new Date(value);

									return date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});
								}}
							/>

							<ChartTooltip
								content={
									<ChartTooltipContent
										className="w-[150px]"
										nameKey="commits"
										labelFormatter={(value) => {
											return new Date(value).toLocaleDateString(
												"en-US",
												{
													month: "short",
													day: "numeric",
													year: "numeric",
												},
											);
										}}
									/>
								}
							/>

							<Bar
								dataKey="commits"
								fill="var(--color-commits)"
								radius={2}
							/>
						</BarChart>
					</ChartContainer>
				</div>
			</div>
		</div>
	);
}