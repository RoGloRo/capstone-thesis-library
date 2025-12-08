"use client";

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RecentBorrow {
  id: string;
  bookTitle: string | null;
  borrowerName: string | null;
  borrowDate: Date;
  dueDate: string;
  status: string;
}

interface RecentlyBorrowedTableProps {
  data: RecentBorrow[];
}

export function RecentlyBorrowedTable({ data }: RecentlyBorrowedTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Borrowed Books</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Borrowed Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((borrow) => (
              <TableRow key={borrow.id}>
                <TableCell className="font-medium">{borrow.bookTitle || 'Unknown Book'}</TableCell>
                <TableCell>{borrow.borrowerName || 'Unknown User'}</TableCell>
                <TableCell>{format(borrow.borrowDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>{borrow.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={borrow.status === 'BORROWED' ? 'default' : 'secondary'}>
                    {borrow.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    Return
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}