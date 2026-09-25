import { CSSProperties } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { createFileRoute } from "@tanstack/react-router";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "#/components/ui/chart";

export const Route = createFileRoute(
	"/$username/$repo/insight/code-frequency",
)({
	component: RouteComponent,
});

const chartData = [
	{ week: "Sep 1", additions: 342, deletions: 145 },
	{ week: "Sep 8", additions: 876, deletions: 354 },
	{ week: "Sep 15", additions: 512, deletions: 289 },
	{ week: "Sep 22", additions: 629, deletions: 421 },
	{ week: "Sep 29", additions: 458, deletions: 167 },
	{ week: "Oct 6", additions: 781, deletions: 298 },
	{ week: "Oct 13", additions: 634, deletions: 376 },
	{ week: "Oct 20", additions: 924, deletions: 512 },
	{ week: "Oct 27", additions: 728, deletions: 341 },
	{ week: "Nov 3", additions: 842, deletions: 428 },
	{ week: "Nov 10", additions: 596, deletions: 267 },
	{ week: "Nov 17", additions: 764, deletions: 389 },
];

const chartConfig = {
	additions: {
		label: "Additions",
		color: "rgb(34 197 94)",
	},
	deletions: {
		label: "Deletions",
		color: "rgb(239 68 68)",
	},
} satisfies ChartConfig;

function CrosshatchPattern({ config }: { config: ChartConfig }) {
	const entries = Object.entries(config).filter(([, value]) => value.color);

	return (
		<>
			{entries.map(([key, { color }]) => (
				<pattern
					key={key}
					id={`code-frequency-crosshatch-${key}`}
					x="0"
					y="0"
					width="8"
					height="8"
					patternUnits="userSpaceOnUse"
				>
					<path
						d="M0,8 L8,0"
						stroke={color}
						strokeWidth="0.8"
						opacity="0.4"
					/>
					<path
						d="M0,0 L8,8"
						stroke={color}
						strokeWidth="0.8"
						opacity="0.2"
					/>
				</pattern>
			))}
		</>
	);
}

function RouteComponent() {
	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				Code frequency over the history of ncdai/chanhdai.com
			</span>

			<div className="overflow-hidden rounded-md border">
				<div className="border-b bg-accent/40 px-4 py-2 font-medium">
					Code Frequency
				</div>

				<div className="px-4 py-6">
					<ChartContainer
						config={chartConfig}
						className="h-[420px] w-full"
					>
						<AreaChart
							accessibilityLayer
							data={chartData}
							margin={{
								top: 20,
								right: 0,
								bottom: 0,
								left: 0,
							}}
						>
							<CartesianGrid
								vertical={false}
								strokeDasharray="3 3"
							/>

							<XAxis
								dataKey="week"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>

							<ChartTooltip
								content={
									<ChartTooltipContent
										indicator="dot"
										className="min-w-44 gap-2.5"
										labelFormatter={(value) => (
											<div className="border-border/50 mb-0.5 border-b pb-2">
												<span className="text-xs font-medium">
													Week of {value}
												</span>
											</div>
										)}
										formatter={(value, name) => (
											<div className="flex w-full items-center justify-between gap-2">
												<div className="flex items-center gap-1.5">
													<div
														className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
														style={
															{
																"--color-bg": `var(--color-${name})`,
															} as CSSProperties
														}
													/>

													<span className="text-muted-foreground">
														{
															chartConfig[
																name as keyof typeof chartConfig
															]?.label
														}
													</span>
												</div>

												<span className="font-semibold tabular-nums text-foreground">
													{Number(value).toLocaleString()}
												</span>
											</div>
										)}
									/>
								}
							/>

							<defs>
								<CrosshatchPattern config={chartConfig} />
							</defs>

							<Area
								dataKey="deletions"
								type="natural"
								fill="url(#code-frequency-crosshatch-deletions)"
								fillOpacity={0.5}
								stroke="var(--color-deletions)"
								stackId="a"
								strokeWidth={1}
							/>

							<Area
								dataKey="additions"
								type="natural"
								fill="url(#code-frequency-crosshatch-additions)"
								fillOpacity={0.5}
								stroke="var(--color-additions)"
								stackId="a"
								strokeWidth={1}
							/>
						</AreaChart>
					</ChartContainer>
				</div>
			</div>
		</div>
	);
}