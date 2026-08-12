"use client";

import { format, parseISO } from "date-fns";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface CommitActivity {
  date: string;
  count: number;
}

interface ContributionChartProps {
  data?: CommitActivity[];
}

const chartConfig = {
  count: {
    label: "Commits",
    color: "#22c55e",
  },
} satisfies ChartConfig;

export function ContributionChart({ data = [] }: ContributionChartProps) {
  const totalCommits = data.reduce((sum, day) => sum + day.count, 0);

  // With 6 or more days the date labels crowd and overlap, so the X-axis
  // date labels are hidden entirely; the line still plots every day's data.
  const hideDateLabels = data.length >= 6;

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-36 w-80">
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
          <defs>
            <linearGradient id="contributionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={!hideDateLabels}
            tickFormatter={(value: string) => format(parseISO(value), "MMM d")}
          />

          <YAxis
            width={20}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />

          <Area
            type="linear"
            dataKey="count"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#contributionFill)"
          />
        </AreaChart>
      </ChartContainer>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground w-80">
        <span>
          {data.length > 0
            ? `${format(parseISO(data[0].date), "MMM d, yyyy")} – ${format(
                parseISO(data[data.length - 1].date),
                "MMM d, yyyy"
              )}`
            : "No activity"}
        </span>
        <span>{totalCommits} commits</span>
      </div>
    </div>
  );
}
