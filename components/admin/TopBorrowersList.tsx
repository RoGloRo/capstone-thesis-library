"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface TopBorrower {
  id: string;
  name: string;
  email: string;
  borrowCount: number;
}

interface TopBorrowersListProps {
  data: TopBorrower[];
}

export function TopBorrowersList({ data }: TopBorrowersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Top Borrowers</CardTitle>
        <CardDescription>
          Ranked by total books borrowed (all-time)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                No borrower activity yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Active borrowers will be ranked here over time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((borrower, index) => (
              <div key={borrower.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                    {index + 1}
                  </div>
                  <Avatar className="shrink-0">
                    <AvatarFallback className="bg-amber-100 dark:bg-amber-200 text-amber-800 dark:text-amber-900">
                      {borrower.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium truncate text-gray-900 dark:text-white">
                      {borrower.name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {borrower.email}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {borrower.borrowCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    book{borrower.borrowCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}