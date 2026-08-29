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
import { LibraryBig } from "lucide-react";
import { useChartColors } from "./chartTheme";

export interface TopBook {
  id: string;
  title: string;
  author: string;
  borrowCount: number;
}

interface TopBooksChartProps {
  data: TopBook[];
}

function truncateTitle(title: string, max: number): string {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

export function TopBooksChart({ data }: TopBooksChartProps) {
  const colors = useChartColors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Top Books</CardTitle>
        <CardDescription>
          Ranked by number of times borrowed (all-time)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <LibraryBig className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                No borrowing activity yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                This list populates as books are borrowed.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
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
                    dataKey="title"
                    width={116}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={
                      {
                        fill: colors.tick,
                        fontSize: 11,
                      } as never
                    }
                    tickFormatter={(t: string) => truncateTitle(t, 22)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: colors.tick,
                    }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(value: number) => [`${value} times borrowed`, "Borrow count"]}
                  />
                  <Bar dataKey="borrowCount" fill={colors.primary} radius={[0, 6, 6, 0]} maxBarSize={26}>
                    <LabelList
                      dataKey="borrowCount"
                      position="right"
                      style={{ fill: colors.tick, fontSize: 12, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Accessible, color-independent ranked list with exact counts. */}
            <ol className="sr-only">
              {data.map((b, i) => (
                <li key={b.id}>
                  {i + 1}. {b.title} — {b.borrowCount} times borrowed
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}