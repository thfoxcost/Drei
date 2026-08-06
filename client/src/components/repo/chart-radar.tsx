"use client";

import {
  CircleDot,
  GitCommit,
  GitPullRequest,
  type LucideIcon,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ActivityDatum {
  activity: string;
  value: number;
  icon: LucideIcon;
}

const chartData: ActivityDatum[] = [
  { activity: "Commits", value: 324, icon: GitCommit },
  { activity: "PRs", value: 123, icon: GitPullRequest },
  { activity: "Issues", value: 100, icon: CircleDot },
];

const chartConfig = {
  value: {
    label: "Activity",
    color: "#22c55e",
  },
} satisfies ChartConfig;

export function ActivityRadarChart() {
  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="mx-auto h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="75%">
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

            <PolarGrid />

            <PolarAngleAxis
              dataKey="activity"
              tick={({ x, y, payload }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-muted-foreground text-xs"
                >
                  {payload.value}
                </text>
              )}
            />

            <PolarRadiusAxis tick={false} axisLine={false} />

            <Radar
              dataKey="value"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "#22c55e",
                stroke: "#22c55e",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}