"use client"

import { Pie, PieChart } from "recharts"
import { ConnectionData } from "@/app/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { connectionLabels } from "./connection-scale"

interface ConnectionBreakdownChartProps {
  connections: ConnectionData[];
}

const chartConfig = {
  count: {
    label: "Connections",
  },
  rating1: {
    label: connectionLabels[0],
    color: "#dbeafe", // Stranger - very light blue
  },
  rating2: {
    label: connectionLabels[1],
    color: "#93c5fd", // Met once or twice - light blue
  },
  rating3: {
    label: connectionLabels[2],
    color: "#60a5fa", // Know them well - medium blue
  },
  rating4: {
    label: connectionLabels[3],
    color: "#3b82f6", // Work well together - blue
  },
  rating5: {
    label: connectionLabels[4],
    color: "#1e40af", // Day-one cofounder - dark blue
  },
} satisfies ChartConfig

export function ConnectionBreakdownChart({ connections }: ConnectionBreakdownChartProps) {
  // Group connections by rating
  const ratingCounts = connections.reduce((acc, conn) => {
    const rating = conn.rating || 1;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Transform to chart data format
  const chartData = Object.entries(ratingCounts).map(([rating, count]) => {
    const ratingKey = `rating${rating}` as 'rating1' | 'rating2' | 'rating3' | 'rating4' | 'rating5';
    return {
      rating: ratingKey,
      label: connectionLabels[parseInt(rating) - 1],
      count,
      fill: chartConfig[ratingKey].color,
    };
  });

  // If no connections, show empty state
  if (connections.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Network Breakdown</CardTitle>
          <CardDescription>Your Connections by Relationship Strength</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex">
          <p className="text-sm text-neutral-500 py-12">No Connections Yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base">Network Breakdown</CardTitle>
        <CardDescription className="text-xs">Your {connections.length} Connections by Relationship Strength</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0 px-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="rating" />} />
            <Pie data={chartData} dataKey="count" nameKey="rating" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
