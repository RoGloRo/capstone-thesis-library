"use client";

import React from 'react';
import { ActiveBooksChart } from './ActiveBooksChart';

interface ActiveBooksChartClientProps {
  totalBooks: number;
  borrowedBooks: number;
}

export default function ActiveBooksChartClient({ totalBooks, borrowedBooks }: ActiveBooksChartClientProps) {
  return <ActiveBooksChart totalBooks={totalBooks} borrowedBooks={borrowedBooks} />;
}
