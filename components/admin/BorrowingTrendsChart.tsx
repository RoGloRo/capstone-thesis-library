"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BorrowingTrendsChartProps {
  data: Array<{
    date: string;
    borrowed: number;
    returned: number;
  }>;
}

export function BorrowingTrendsChart({ data }: BorrowingTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowing Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="borrowed" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="returned" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}