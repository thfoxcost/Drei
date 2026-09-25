import {
	CircleCheck,
	CircleDot,
	GitPullRequest,
	GitPullRequestClosed,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "#/components/ui/chart";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/$repo/insight/")({
	component: RouteComponent,
});

const contributors = [
	{
		name: "Alex",
		commits: 42,
		avatar: "https://i.pravatar.cc/80?img=12",
	},
	{
		name: "Sarah",
		commits: 31,
		avatar: "https://i.pravatar.cc/80?img=32",
	},
	{
		name: "John",
		commits: 24,
		avatar: "https://i.pravatar.cc/80?img=11",
	},
	{
		name: "Mike",
		commits: 19,
		avatar: "https://i.pravatar.cc/80?img=13",
	},
	{
		name: "Emma",
		commits: 15,
		avatar: "https://i.pravatar.cc/80?img=47",
	},
];

const chartConfig = {
	commits: {
		label: "Commits",
		color: "rgb(59 130 246)",
	},
} satisfies ChartConfig;

function ContributorTick({
	x,
	y,
	payload,
}: {
	x?: number;
	y?: number;
	payload?: { value: string };
}) {
	const contributor = contributors.find(
		(item) => item.name === payload?.value,
	);

	if (!contributor) return null;

	return (
		<g transform={`translate(${x},${y})`}>
			<foreignObject x={-14} y={4} width={28} height={28}>
				<img
					src={contributor.avatar}
					alt={contributor.name}
					className="size-7 rounded-full border"
				/>
			</foreignObject>
		</g>
	);
}

function RouteComponent() {
	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				September 17, 2026 - September 24, 2026
			</span>

			<div className="w-full">
				<div className="rounded-t-md border bg-accent/40 px-4 py-2">
					Overview
				</div>

				<div className="grid grid-cols-2 divide-x border border-t-0">
					<div className="px-5 py-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								Pull Requests
							</span>
							<span className="font-semibold">36</span>
						</div>

						<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="bg-purple-500"
								style={{ width: "67%" }}
							/>
							<div
								className="bg-red-500"
								style={{ width: "33%" }}
							/>
						</div>

						<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-purple-500" />
								24 merged
							</span>

							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-red-500" />
								12 closed
							</span>
						</div>
					</div>

					<div className="px-5 py-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								Issues
							</span>
							<span className="font-semibold">32</span>
						</div>

						<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="bg-purple-500"
								style={{ width: "56%" }}
							/>
							<div
								className="bg-green-500"
								style={{ width: "44%" }}
							/>
						</div>

						<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-purple-500" />
								18 closed
							</span>

							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-green-500" />
								14 new
							</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 divide-x border border-t-0">
					<div className="grid grid-cols-2 divide-x">
						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<GitPullRequest className="size-4.5 text-purple-500" />
								<span className="text-base font-medium">24</span>
							</div>

							<span className="text-sm text-muted-foreground">
								Merged Pull Requests
							</span>
						</div>

						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<GitPullRequestClosed className="size-4.5 text-red-500" />
								<span className="text-base font-medium">12</span>
							</div>

							<span className="text-sm text-muted-foreground">
								Closed Pull Requests
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 divide-x">
						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<CircleCheck className="size-4.5 text-purple-500" />
								<span className="text-base font-medium">18</span>
							</div>

							<span className="text-sm text-muted-foreground">
								Closed Issues
							</span>
						</div>

						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<CircleDot className="size-4.5 text-green-500" />
								<span className="text-base font-medium">14</span>
							</div>

							<span className="text-sm text-muted-foreground">
								New Issues
							</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 divide-x rounded-b-md border border-t-0">
					<div className="px-5 py-4 text-sm leading-7 text-muted-foreground">
						Excluding merges,{" "}
						<strong className="font-semibold text-foreground">
							1 author
						</strong>{" "}
						has pushed{" "}
						<strong className="font-semibold text-foreground">
							1 commit
						</strong>{" "}
						to{" "}
						<strong className="font-semibold text-foreground">
							main
						</strong>{" "}
						and{" "}
						<strong className="font-semibold text-foreground">
							1 commit
						</strong>{" "}
						to all branches. On main,{" "}
						<strong className="font-semibold text-foreground">
							2 files
						</strong>{" "}
						have changed and there have been{" "}
						<strong className="font-semibold text-green-500">
							12 additions
						</strong>{" "}
						and{" "}
						<strong className="font-semibold text-red-500">
							0 deletions
						</strong>
						.
					</div>

					<div className="px-5 py-2">
						<ChartContainer
							config={chartConfig}
							className="h-[140px] w-full"
						>
							<BarChart
								accessibilityLayer
								data={contributors}
								margin={{
									top: 8,
									right: 8,
									left: 8,
									bottom: 20,
								}}
							>
								<CartesianGrid vertical={false} />

								<XAxis
									dataKey="name"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									tick={<ContributorTick />}
								/>

								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent hideLabel />
									}
								/>

								<Bar
									dataKey="commits"
									fill="rgb(59 130 250)"
									radius={6}
								/>
							</BarChart>
						</ChartContainer>
					</div>
				</div>
			</div>
		</div>
	);
}