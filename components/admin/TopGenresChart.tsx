"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopGenresChartProps {
  data: Array<{ genre: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function polarPath(centerX: number, centerY: number, radius: number, start: number, end: number) {
  const x1 = centerX + radius * Math.cos(start);
  const y1 = centerY + radius * Math.sin(start);
  const x2 = centerX + radius * Math.cos(end);
  const y2 = centerY + radius * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function TopGenresChart({ data }: TopGenresChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Genres</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">No genre data available</div>
        ) : (
          <div className="flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {data.map((d, i) => {
                const portion = d.count / total;
                const next = angle + portion * Math.PI * 2;
                const dPath = polarPath(cx, cy, 90, angle, next);
                angle = next;
                return <path key={d.genre} d={dPath} fill={COLORS[i % COLORS.length]} stroke="#fff" />;
              })}
            </svg>
            <div className="mt-3 w-full">
              {data.map((d, i) => (
                <div key={d.genre} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{d.genre}</span>
                  </div>
                  <div className="text-muted-foreground">{((d.count / total) * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}