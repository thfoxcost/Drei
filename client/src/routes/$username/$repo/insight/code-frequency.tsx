import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { useCodeFrequency } from "#/hooks/useInsights";

export const Route = createFileRoute("/$username/$repo/insight/code-frequency")(
	{
		component: RouteComponent,
	},
);

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
					<path d="M0,8 L8,0" stroke={color} strokeWidth="0.8" opacity="0.4" />
					<path d="M0,0 L8,8" stroke={color} strokeWidth="0.8" opacity="0.2" />
				</pattern>
			))}
		</>
	);
}

function RouteComponent() {
	const { t } = useTranslation();
	const { username, repo } = Route.useParams();
	const { data, isPending, isError } = useCodeFrequency(username, repo);
	const chartData = data ?? [];

	const chartConfig = {
		additions: {
			label: t("insights.codeFrequency.additions"),
			color: "rgb(34 197 94)",
		},
		deletions: {
			label: t("insights.codeFrequency.deletions"),
			color: "rgb(239 68 68)",
		},
	} satisfies ChartConfig;

	return (
		<div className="flex w-full flex-col gap-4">
			<span className="text-2xl font-medium">
				{t("insights.codeFrequency.heading", { owner: username, repo })}
			</span>

			<div className="overflow-hidden rounded-md border">
				<div className="border-b bg-accent/40 px-4 py-2 font-medium">
					{t("insights.codeFrequency.subheading")}
				</div>

				<div className="px-4 py-6">
					{isPending ? (
						<div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
							{t("insights.codeFrequency.loading")}
						</div>
					) : isError ? (
						<div className="flex h-[420px] items-center justify-center text-sm text-destructive">
							{t("insights.codeFrequency.loadFailed")}
						</div>
					) : chartData.length === 0 ? (
						<div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
							{t("insights.codeFrequency.empty")}
						</div>
					) : (
						<ChartContainer config={chartConfig} className="h-[420px] w-full">
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
								<CartesianGrid vertical={false} strokeDasharray="3 3" />

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
														{t("insights.codeFrequency.weekOf", { value })}
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
																chartConfig[name as keyof typeof chartConfig]
																	?.label
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
					)}
				</div>
			</div>
		</div>
	);
}
