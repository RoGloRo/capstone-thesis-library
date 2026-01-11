"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActiveBooksChartProps {
  totalBooks: number;
  borrowedBooks: number;
}

const COLORS = ['#FF8042', '#00C49F'];

export function ActiveBooksChart({ totalBooks, borrowedBooks }: ActiveBooksChartProps) {
  const availableBooks = Math.max(totalBooks - borrowedBooks, 0);
  const percent = totalBooks > 0 ? (borrowedBooks / totalBooks) : 0;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const start = -Math.PI / 2;
  const end = start + percent * Math.PI * 2;

  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = percent > 0.5 ? 1 : 0;
  const arc = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active vs Available Books</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={cx} cy={cy} r={r} fill={COLORS[1]} />
              <path d={arc} fill={COLORS[0]} />
              <circle cx={cx} cy={cy} r={r - 30} fill="#fff" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{(percent * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-around text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold">{borrowedBooks}</div>
            <div className="text-muted-foreground">Borrowed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{availableBooks}</div>
            <div className="text-muted-foreground">Available</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}