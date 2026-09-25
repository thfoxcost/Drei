"use client";

import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "#/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";

export const Route = createFileRoute(
	"/$username/$repo/insight/contributors",
)({
	component: RouteComponent,
});

const chartData = [
	{ date: "Sep 1", commits: 12 },
	{ date: "Sep 2", commits: 16 },
	{ date: "Sep 3", commits: 17 },
	{ date: "Sep 4", commits: 21 },
	{ date: "Sep 5", commits: 20 },
	{ date: "Sep 6", commits: 23 },
	{ date: "Sep 7", commits: 21 },
	{ date: "Sep 8", commits: 26 },
	{ date: "Sep 9", commits: 25 },
	{ date: "Sep 10", commits: 24 },
	{ date: "Sep 11", commits: 23 },
	{ date: "Sep 12", commits: 30 },
	{ date: "Sep 13", commits: 22 },
	{ date: "Sep 14", commits: 31 },
	{ date: "Sep 15", commits: 29 },
	{ date: "Sep 16", commits: 28 },
	{ date: "Sep 17", commits: 31 },
	{ date: "Sep 18", commits: 25 },
	{ date: "Sep 19", commits: 25 },
	{ date: "Sep 20", commits: 20 },
	{ date: "Sep 21", commits: 34 },
	{ date: "Sep 22", commits: 25 },
	{ date: "Sep 23", commits: 31 },
	{ date: "Sep 24", commits: 24 },
	{ date: "Sep 25", commits: 32 },
];

const chartConfig = {
	commits: {
		label: "Commits",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

const contributors = [
	{
		username: "thefoxcost",
		name: "Michael Rodriguez",
		initials: "MR",
		avatar:
			"https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80",
		commits: 307,
		additions: 311,
		deletions: 23,
		rank: 1,
		data: [
			{ date: "Sep 1", commits: 8 },
			{ date: "Sep 2", commits: 12 },
			{ date: "Sep 3", commits: 5 },
			{ date: "Sep 4", commits: 14 },
			{ date: "Sep 5", commits: 9 },
			{ date: "Sep 6", commits: 17 },
			{ date: "Sep 7", commits: 11 },
			{ date: "Sep 8", commits: 15 },
			{ date: "Sep 9", commits: 7 },
			{ date: "Sep 10", commits: 18 },
			{ date: "Sep 11", commits: 13 },
			{ date: "Sep 12", commits: 20 },
		],
	},
	{
		username: "alexdev",
		name: "Alex Johnson",
		initials: "AJ",
		avatar:
			"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80",
		commits: 241,
		additions: 284,
		deletions: 31,
		rank: 2,
		data: [
			{ date: "Sep 1", commits: 4 },
			{ date: "Sep 2", commits: 9 },
			{ date: "Sep 3", commits: 7 },
			{ date: "Sep 4", commits: 12 },
			{ date: "Sep 5", commits: 6 },
			{ date: "Sep 6", commits: 14 },
			{ date: "Sep 7", commits: 8 },
			{ date: "Sep 8", commits: 11 },
			{ date: "Sep 9", commits: 13 },
			{ date: "Sep 10", commits: 10 },
			{ date: "Sep 11", commits: 16 },
			{ date: "Sep 12", commits: 12 },
		],
	},
	{
		username: "sarahdev",
		name: "Sarah Williams",
		initials: "SW",
		avatar:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&dpr=2&q=80",
		commits: 198,
		additions: 226,
		deletions: 18,
		rank: 3,
		data: [
			{ date: "Sep 1", commits: 3 },
			{ date: "Sep 2", commits: 6 },
			{ date: "Sep 3", commits: 8 },
			{ date: "Sep 4", commits: 5 },
			{ date: "Sep 5", commits: 11 },
			{ date: "Sep 6", commits: 7 },
			{ date: "Sep 7", commits: 13 },
			{ date: "Sep 8", commits: 9 },
			{ date: "Sep 9", commits: 15 },
			{ date: "Sep 10", commits: 8 },
			{ date: "Sep 11", commits: 12 },
			{ date: "Sep 12", commits: 10 },
		],
	},
];

const contributorChartConfig = {
	commits: {
		label: "Commits",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function ContributorChart({
	data,
}: {
	data: { date: string; commits: number }[];
}) {
	return (
		<ChartContainer
			config={contributorChartConfig}
			className="h-[90px] w-full"
		>
			<AreaChart
				accessibilityLayer
				data={data}
				margin={{
					top: 8,
					right: 0,
					left: 0,
					bottom: 0,
				}}
			>
				<CartesianGrid vertical={false} horizontal={false} />

				<XAxis
					dataKey="date"
					hide
				/>

				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							indicator="dot"
							hideLabel
						/>
					}
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
	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				Contributors to ncdai/chanhdai.com
			</span>

			<div className="overflow-hidden rounded-md border">
				<div className="border-b bg-accent/40 px-4 py-2 font-medium">
					Commits per day
				</div>

				<div className="py-6">
					<ChartContainer
						config={chartConfig}
						className="h-[250px] w-full"
					>
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
								content={
									<ChartTooltipContent
										indicator="dot"
										hideLabel
									/>
								}
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
				</div>
			</div>

			<div className="grid w-full gap-2 md:grid-cols-2 lg:grid-cols-3">
				{contributors.map((contributor) => (
					<div
						key={contributor.username}
						className="overflow-hidden rounded-md border"
					>
						<div className="flex items-center gap-2 p-2">
							<Avatar size="lg">
								<AvatarImage
									src={contributor.avatar}
									alt={contributor.name}
								/>
								<AvatarFallback>
									{contributor.initials}
								</AvatarFallback>
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

							<Badge
								variant="outline"
								className="ml-auto shrink-0"
							>
								#{contributor.rank}
							</Badge>
						</div>

						<div className="border-t p-2 pt-2">
							<ContributorChart data={contributor.data} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}