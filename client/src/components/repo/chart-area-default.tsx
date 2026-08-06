"use client";

import { Area, AreaChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { day: "Mon", contributions: 12 },
  { day: "Tue", contributions: 24 },
  { day: "Wed", contributions: 18 },
  { day: "Thu", contributions: 31 },
  { day: "Fri", contributions: 16 },
  { day: "Sat", contributions: 42 },
  { day: "Sun", contributions: 27 },
];

const chartConfig = {
  contributions: {
    label: "Contributions",
    color: "#22c55e",
  },
} satisfies ChartConfig;

export function ContributionChart() {
  const totalContributions = chartData.reduce(
    (sum, day) => sum + day.contributions,
    0
  );

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-36 w-80">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: 8,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="contributionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />

          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />

          <Area
            type="linear"
            dataKey="contributions"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#contributionFill)"
          />
        </AreaChart>
      </ChartContainer>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground w-80">
        <span>Past 7 days</span>
        <span>{totalContributions} contributions</span>
      </div>
    </div>
  );
}