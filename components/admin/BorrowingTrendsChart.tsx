"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BorrowingTrendsChartProps {
  data: Array<{ date: string; borrowed: number; returned: number }>;
}

function buildPath(points: number[], width: number, height: number) {
  if (!points.length) return '';
  const max = Math.max(...points, 1);
  const step = width / Math.max(points.length - 1, 1);
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (p / max) * height}`)
    .join(' ');
}

export function BorrowingTrendsChart({ data }: BorrowingTrendsChartProps) {
  const width = 700;
  const height = 300;

  const dates = data.map((d) => d.date);
  const borrowedPoints = data.map((d) => d.borrowed);
  const returnedPoints = data.map((d) => d.returned);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowing Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8884d8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8884d8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={buildPath(borrowedPoints, width, height)} fill="none" stroke="#8884d8" strokeWidth={2} />
              <path d={buildPath(returnedPoints, width, height)} fill="none" stroke="#82ca9d" strokeWidth={2} />
            </svg>
            <div className="mt-2 text-sm text-muted-foreground grid grid-cols-3 gap-2">
              <div>Points: {data.length}</div>
              <div>Latest borrowed: {data[data.length - 1]?.borrowed ?? 0}</div>
              <div>Latest returned: {data[data.length - 1]?.returned ?? 0}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}