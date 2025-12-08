"use client";

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OverdueBook {
  id: string;
  bookTitle: string | null;
  borrowerName: string | null;
  borrowDate: Date;
  dueDate: string;
  daysOverdue: number;
}

interface OverdueBooksTableProps {
  data: OverdueBook[];
}

export function OverdueBooksTable({ data }: OverdueBooksTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Overdue Books</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Borrowed Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((book) => (
              <TableRow key={book.id} className="bg-red-50">
                <TableCell className="font-medium">{book.bookTitle || 'Unknown Book'}</TableCell>
                <TableCell>{book.borrowerName || 'Unknown User'}</TableCell>
                <TableCell>{format(book.borrowDate, 'MMM dd, yyyy')}</TableCell>
                <TableCell>{book.dueDate}</TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    {book.daysOverdue} days
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive">
                    Send Reminder
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