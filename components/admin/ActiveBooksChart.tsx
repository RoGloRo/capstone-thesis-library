"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookCopy } from "lucide-react";
import { useChartColors } from "./chartTheme";

interface ActiveBooksChartProps {
  /** Total physical copies (SUM(total_copies)). */
  totalBooks: number;
  /** Available physical copies (SUM(available_copies)). */
  availableBooks: number;
}

export function ActiveBooksChart({
  totalBooks,
  availableBooks,
}: ActiveBooksChartProps) {
  const colors = useChartColors();

  const borrowed = Math.max(totalBooks - availableBooks, 0);
  const percentBorrowed =
    totalBooks > 0 ? (borrowed / totalBooks) * 100 : 0;

  const data = [
    { name: "Available", value: availableBooks, fill: colors.primary },
    { name: "Borrowed", value: borrowed, fill: colors.accent },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">
          Book Availability
        </CardTitle>
        <CardDescription>
          Physical copies currently borrowed vs available
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalBooks <= 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <BookCopy className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                No books in the catalogue yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Availability will appear once books are added.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mx-auto h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={88}
                    paddingAngle={2}
                    cornerRadius={4}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 600, color: colors.tick }}
                    formatter={(value: number, name: string) => [
                      `${value} cop${value === 1 ? "y" : "ies"}`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label: % + label (not dependent on color). */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {percentBorrowed.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Borrowed
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {borrowed.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Borrowed</div>
              </div>
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {availableBooks.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {totalBooks.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Books</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}