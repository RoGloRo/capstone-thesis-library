"use client";

import React from 'react';
import { BorrowingTrendsChart } from './BorrowingTrendsChart';
import { TopGenresChart } from './TopGenresChart';

interface ClientChartsProps {
  borrowingTrends: Array<{ date: string; borrowed: number; returned: number }>;
  topGenres: Array<{ genre: string; count: number }>;
}

export default function ClientCharts({ borrowingTrends, topGenres }: ClientChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <BorrowingTrendsChart data={borrowingTrends} />
      </div>
      <div>
        <TopGenresChart data={topGenres} />
      </div>
    </div>
  );
}
