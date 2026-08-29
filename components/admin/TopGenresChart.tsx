"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
import { LayoutList } from "lucide-react";
import { useChartColors } from "./chartTheme";

export interface GenreItem {
  genre: string;
  count: number;
}

interface TopGenresChartProps {
  genres: GenreItem[];
  total: number;
}

function truncateGenre(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function TopGenresChart({ genres, total }: TopGenresChartProps) {
  const colors = useChartColors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Top Genres</CardTitle>
        <CardDescription>
          Ranked by number of borrows (all-time)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {genres.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <LayoutList className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                No borrow activity yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Genre popularity appears once books are borrowed.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genres}
                layout="vertical"
                margin={{ top: 4, right: 44, bottom: 4, left: 0 }}
              >
                <CartesianGrid
                  stroke={colors.grid}
                  strokeDasharray="3 3"
                  horizontal
                  vertical={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="genre"
                  width={104}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={
                    {
                      fill: colors.tick,
                      fontSize: 11,
                    } as never
                  }
                  tickFormatter={(t: string) => truncateGenre(t, 20)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ fontWeight: 600, color: colors.tick }}
                  formatter={(value: number) => [
                    `${value} borrow${value === 1 ? "" : "s"}`,
                    "Count",
                  ]}
                />
                <Bar
                  dataKey="count"
                  fill={colors.primary}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={26}
                >
                  <LabelList
                    dataKey="count"
                    position="right"
                    style={{ fill: colors.tick, fontSize: 12, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {genres.length > 0 && (
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>Total borrows (all genres)</span>
            <span className="font-semibold">{total.toLocaleString()} borrows</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}