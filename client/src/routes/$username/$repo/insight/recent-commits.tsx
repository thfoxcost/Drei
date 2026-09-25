import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { useRepoData } from "#/hooks/useRepoData";

export const Route = createFileRoute("/$username/$repo/insight/recent-commits")(
	{
		component: RouteComponent,
	},
);

const chartConfig = {
	commits: {
		label: "Commits",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const WINDOW_DAYS = 30;

function RouteComponent() {
	const { username, repo } = Route.useParams();
	const { data, isPending, isError } = useRepoData(username, repo);

	const chartData = React.useMemo(() => {
		const activity = data?.commitActivity ?? [];
		const tail = activity.slice(-WINDOW_DAYS);
		return tail.map((d) => ({ date: d.date, commits: d.count }));
	}, [data]);

	const total = React.useMemo(
		() => chartData.reduce((acc, curr) => acc + curr.commits, 0),
		[chartData],
	);

	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				Recent commits for {username}/{repo}
			</span>

			<div className="overflow-hidden rounded-md border">
				<div className="flex flex-col items-stretch border-b sm:flex-row">
					<div className="flex flex-1 flex-col justify-center gap-1 bg-accent/40 px-6 py-4">
						<span className="font-medium">Recent Commits</span>
						<span className="text-sm text-muted-foreground">
							Showing commits over the last {WINDOW_DAYS} days
						</span>
					</div>

					<div className="flex border-t sm:border-t-0 sm:border-l">
						<div className="flex min-w-32 flex-col justify-center gap-1 px-6 py-4">
							<span className="text-xs text-muted-foreground">
								Total commits
							</span>
							<span className="text-lg font-bold sm:text-3xl">
								{total.toLocaleString()}
							</span>
						</div>
					</div>
				</div>

				<div className="px-2 py-6 sm:p-6">
					{isPending ? (
						<div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
							Loading commit activity…
						</div>
					) : isError ? (
						<div className="flex h-[300px] items-center justify-center text-sm text-destructive">
							Failed to load commit activity.
						</div>
					) : chartData.length === 0 ? (
						<div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
							No commits yet in this repository.
						</div>
					) : (
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
												return new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												});
											}}
										/>
									}
								/>

								<Bar dataKey="commits" fill="var(--color-commits)" radius={2} />
							</BarChart>
						</ChartContainer>
					)}
				</div>
			</div>
		</div>
	);
}
