"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
        <CardTitle>Top Borrowers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((borrower, index) => (
            <div key={borrower.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {index + 1}
                </div>
                <Avatar>
                  <AvatarFallback>
                    {borrower.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{borrower.name}</div>
                  <div className="text-sm text-muted-foreground">{borrower.email}</div>
                </div>
              </div>
              <Badge variant="secondary">
                {borrower.borrowCount} books
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}