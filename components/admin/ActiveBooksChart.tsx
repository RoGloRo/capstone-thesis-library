"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActiveBooksChartProps {
  totalBooks: number;
  borrowedBooks: number;
}

const COLORS = ['#FF8042', '#00C49F'];

export function ActiveBooksChart({ totalBooks, borrowedBooks }: ActiveBooksChartProps) {
  const availableBooks = totalBooks - borrowedBooks;
  const data = [
    { name: 'Borrowed', value: borrowedBooks },
    { name: 'Available', value: availableBooks }
  ];

  const percentage = totalBooks > 0 ? ((borrowedBooks / totalBooks) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active vs Available Books</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{percentage}%</div>
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