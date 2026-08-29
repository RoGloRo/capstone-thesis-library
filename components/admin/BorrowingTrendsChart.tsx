"use client";

import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useChartColors } from "./chartTheme";

export interface TrendPoint {
  date: string;
  borrowed: number;
  returned: number;
}

interface BorrowingTrendsChartProps {
  data: TrendPoint[];
  granularity: "daily" | "monthly";
  hasData: boolean;
}

export function BorrowingTrendsChart({
  data,
  granularity,
  hasData,
}: BorrowingTrendsChartProps) {
  const colors = useChartColors();

  const description =
    granularity === "monthly"
      ? "Borrows vs returns per month (last 12 months)"
      : "Borrows vs returns per day (last 30 days)";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Borrowing Trends
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData || data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <TrendingUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                No borrowing activity yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Borrowing and return trends will appear here as activity happens.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
                accessibilityLayer
              >
                <CartesianGrid
                  stroke={colors.grid}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={18}
                  tick={
                    {
                      fill: colors.tick,
                      fontSize: 11,
                    } as never
                  }
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  tick={
                    {
                      fill: colors.tick,
                      fontSize: 11,
                    } as never
                  }
                />
                <Tooltip
                  cursor={{ stroke: colors.tick, strokeDasharray: "4 4" }}
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600, color: colors.tick }}
                  formatter={(value: number, name: string) => {
                    const label =
                      name === "borrowed"
                        ? "Borrowed"
                        : name === "returned"
                          ? "Returned"
                          : name;
                    return [`${value}`, label];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: colors.tick }}
                  iconType="plainline"
                />
                <Area
                  type="monotone"
                  dataKey="borrowed"
                  name="Borrowed"
                  stroke={colors.primary}
                  strokeWidth={2}
                  fill={colors.primary}
                  fillOpacity={0.12}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="returned"
                  name="Returned"
                  stroke={colors.secondary}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}