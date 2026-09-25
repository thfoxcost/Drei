import { createFileRoute } from "@tanstack/react-router";
import {
	CircleCheck,
	CircleDot,
	GitPullRequest,
	GitPullRequestClosed,
} from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { usePullRequests } from "#/hooks/PRs/use-pull-requests";
import { usePulse } from "#/hooks/useInsights";
import { useIssues } from "#/hooks/useIssues";
import { useRepoData } from "#/hooks/useRepoData";

export const Route = createFileRoute("/$username/$repo/insight/")({
	component: RouteComponent,
});

const chartConfig = {
	commits: {
		label: "Commits",
		color: "rgb(59 130 246)",
	},
} satisfies ChartConfig;

function getInitials(name: string) {
	const trimmed = name.trim();
	if (!trimmed) return "??";
	const parts = trimmed.split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRange(start: string, end: string) {
	const fmt = (iso: string) =>
		new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString(
			"en-US",
			{ month: "long", day: "numeric", year: "numeric" },
		);
	try {
		return `${fmt(start)} - ${fmt(end)}`;
	} catch {
		return `${start} - ${end}`;
	}
}

function RouteComponent() {
	const { username, repo } = Route.useParams();
	const { data: repoData } = useRepoData(username, repo);
	const { data: issues } = useIssues(username, repo);
	const { data: pulls } = usePullRequests(username, repo);
	const { data: pulse } = usePulse(username, repo, 7);

	const mergedPRs = pulls?.merged ?? 0;
	const closedPRs = pulls?.closed ?? 0;
	const totalPRs = mergedPRs + closedPRs + (pulls?.open ?? 0);
	const mergedPct = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;
	const closedPrPct = totalPRs > 0 ? (closedPRs / totalPRs) * 100 : 0;

	const closedIssues = issues?.closed ?? 0;
	const openIssues = issues?.open ?? 0;
	const totalIssues = closedIssues + openIssues;
	const closedIssuePct =
		totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0;
	const openIssuePct = totalIssues > 0 ? (openIssues / totalIssues) * 100 : 0;

	const topContributors = useMemo(() => {
		const commits = repoData?.commits ?? [];
		const counts = new Map<string, number>();
		for (const c of commits) {
			const author = (c.author || "unknown").trim();
			if (!author) continue;
			counts.set(author, (counts.get(author) ?? 0) + 1);
		}
		const avatarByName = new Map<string, string | null>();
		for (const c of repoData?.contributors ?? []) {
			avatarByName.set(c.username.toLowerCase(), c.avatar);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([name, count]) => ({
				name,
				commits: count,
				avatar: avatarByName.get(name.toLowerCase()) ?? null,
			}));
	}, [repoData]);

	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				{pulse ? formatRange(pulse.start, pulse.end) : "Last 7 days"}
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
							<span className="font-semibold">{totalPRs}</span>
						</div>

						<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="bg-purple-500"
								style={{ width: `${mergedPct}%` }}
							/>
							<div
								className="bg-red-500"
								style={{ width: `${closedPrPct}%` }}
							/>
						</div>

						<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-purple-500" />
								{mergedPRs} merged
							</span>

							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-red-500" />
								{closedPRs} closed
							</span>
						</div>
					</div>

					<div className="px-5 py-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Issues</span>
							<span className="font-semibold">{totalIssues}</span>
						</div>

						<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="bg-purple-500"
								style={{ width: `${closedIssuePct}%` }}
							/>
							<div
								className="bg-green-500"
								style={{ width: `${openIssuePct}%` }}
							/>
						</div>

						<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-purple-500" />
								{closedIssues} closed
							</span>

							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-green-500" />
								{openIssues} new
							</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 divide-x border border-t-0">
					<div className="grid grid-cols-2 divide-x">
						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<GitPullRequest className="size-4.5 text-purple-500" />
								<span className="text-base font-medium">{mergedPRs}</span>
							</div>

							<span className="text-sm text-muted-foreground">
								Merged Pull Requests
							</span>
						</div>

						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<GitPullRequestClosed className="size-4.5 text-red-500" />
								<span className="text-base font-medium">{closedPRs}</span>
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
								<span className="text-base font-medium">{closedIssues}</span>
							</div>

							<span className="text-sm text-muted-foreground">
								Closed Issues
							</span>
						</div>

						<div className="flex flex-col items-center gap-1 p-3 text-center">
							<div className="flex items-center gap-1">
								<CircleDot className="size-4.5 text-green-500" />
								<span className="text-base font-medium">{openIssues}</span>
							</div>

							<span className="text-sm text-muted-foreground">New Issues</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 divide-x rounded-b-md border border-t-0">
					<div className="px-5 py-4 text-sm leading-7 text-muted-foreground">
						Excluding merges,{" "}
						<strong className="font-semibold text-foreground">
							{pulse?.authors ?? 0}{" "}
							{(pulse?.authors ?? 0) === 1 ? "author" : "authors"}
						</strong>{" "}
						has pushed{" "}
						<strong className="font-semibold text-foreground">
							{pulse?.commits ?? 0}{" "}
							{(pulse?.commits ?? 0) === 1 ? "commit" : "commits"}
						</strong>{" "}
						to{" "}
						<strong className="font-semibold text-foreground">
							{pulse?.defaultBranch ?? repoData?.defaultBranch ?? "main"}
						</strong>{" "}
						and{" "}
						<strong className="font-semibold text-foreground">
							{pulse?.commits ?? 0}{" "}
							{(pulse?.commits ?? 0) === 1 ? "commit" : "commits"}
						</strong>{" "}
						to all branches. On{" "}
						{pulse?.defaultBranch ?? repoData?.defaultBranch ?? "main"},{" "}
						<strong className="font-semibold text-foreground">
							{pulse?.filesChanged ?? 0} files
						</strong>{" "}
						have changed and there have been{" "}
						<strong className="font-semibold text-green-500">
							{pulse?.additions ?? 0} additions
						</strong>{" "}
						and{" "}
						<strong className="font-semibold text-red-500">
							{pulse?.deletions ?? 0} deletions
						</strong>
						.
					</div>

					<div className="px-5 py-2">
						{topContributors.length === 0 ? (
							<div className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
								No commits yet.
							</div>
						) : (
							<ChartContainer config={chartConfig} className="h-[140px] w-full">
								<BarChart
									accessibilityLayer
									data={topContributors}
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
										tick={(props: {
											x?: number;
											y?: number;
											payload?: { value: string };
										}) => {
											const contributor = topContributors.find(
												(item) => item.name === props.payload?.value,
											);
											if (!contributor) return <g />;
											return (
												<g transform={`translate(${props.x},${props.y})`}>
													<foreignObject x={-14} y={4} width={28} height={28}>
														{contributor.avatar ? (
															<img
																src={contributor.avatar}
																alt={contributor.name}
																className="size-7 rounded-full border"
															/>
														) : (
															<span className="flex size-7 items-center justify-center rounded-full border bg-muted text-[10px] font-medium">
																{getInitials(contributor.name)}
															</span>
														)}
													</foreignObject>
												</g>
											);
										}}
									/>

									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent hideLabel />}
									/>

									<Bar dataKey="commits" fill="rgb(59 130 250)" radius={6} />
								</BarChart>
							</ChartContainer>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
