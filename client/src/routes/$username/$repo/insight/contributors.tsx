"use client";

import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { type InsightDaily, useInsightContributors } from "#/hooks/useInsights";

export const Route = createFileRoute("/$username/$repo/insight/contributors")({
	component: RouteComponent,
});

const chartConfig = {
	commits: {
		label: "Commits",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

const contributorChartConfig = {
	commits: {
		label: "Commits",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function ContributorChart({ data }: { data: InsightDaily[] }) {
	return (
		<ChartContainer config={contributorChartConfig} className="h-[90px] w-full">
			<AreaChart
				accessibilityLayer
				data={data.map((d) => ({ date: d.date, commits: d.commits }))}
				margin={{
					top: 8,
					right: 0,
					left: 0,
					bottom: 0,
				}}
			>
				<CartesianGrid vertical={false} horizontal={false} />

				<XAxis dataKey="date" hide />

				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="dot" hideLabel />}
				/>

				<Area
					dataKey="commits"
					type="linear"
					fill="var(--color-commits)"
					fillOpacity={0.2}
					stroke="var(--color-commits)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}

function RouteComponent() {
	const { username, repo } = Route.useParams();
	const { data, isPending, isError } = useInsightContributors(username, repo);

	const chartData = (data?.daily ?? []).map((d) => ({
		date: new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		commits: d.commits,
	}));
	const contributors = data?.contributors ?? [];

	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				Contributors to {username}/{repo}
			</span>

			<div className="overflow-hidden rounded-md border">
				<div className="border-b bg-accent/40 px-4 py-2 font-medium">
					Commits per day
				</div>

				<div className="py-6">
					{isPending ? (
						<div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
							Loading contributors…
						</div>
					) : isError ? (
						<div className="flex h-[250px] items-center justify-center text-sm text-destructive">
							Failed to load contributors.
						</div>
					) : (
						<ChartContainer config={chartConfig} className="h-[250px] w-full">
							<AreaChart
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
								/>

								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent indicator="dot" hideLabel />}
								/>

								<Area
									dataKey="commits"
									type="linear"
									fill="var(--color-commits)"
									fillOpacity={0.4}
									stroke="var(--color-commits)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ChartContainer>
					)}
				</div>
			</div>

			{!isPending && !isError && contributors.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
					No contributors yet in this repository.
				</div>
			) : (
				<div className="grid w-full gap-2 md:grid-cols-2 lg:grid-cols-3">
					{contributors.map((contributor) => (
						<div
							key={contributor.username}
							className="overflow-hidden rounded-md border"
						>
							<div className="flex items-center gap-2 p-2">
								<Avatar size="lg">
									{contributor.avatar ? (
										<AvatarImage
											src={contributor.avatar}
											alt={contributor.username}
										/>
									) : null}
									<AvatarFallback>{contributor.initials}</AvatarFallback>
								</Avatar>

								<div className="flex min-w-0 flex-col">
									<span>{contributor.username}</span>

									<span className="text-xs">
										<span className="text-muted-foreground">
											{contributor.commits} commits
										</span>{" "}
										<span className="text-green-500">
											{contributor.additions}++
										</span>{" "}
										<span className="text-red-500">
											{contributor.deletions}--
										</span>
									</span>
								</div>

								<Badge variant="outline" className="ml-auto shrink-0">
									#{contributor.rank}
								</Badge>
							</div>

							<div className="border-t p-2 pt-2">
								<ContributorChart data={contributor.daily} />
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
