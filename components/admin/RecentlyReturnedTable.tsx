"use client";

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RecentReturn {
  id: string;
  bookTitle: string | null;
  borrowerName: string | null;
  returnDate: Date | null;
  borrowDate: Date;
  status: string;
}

interface RecentlyReturnedTableProps {
  data: RecentReturn[];
}

export function RecentlyReturnedTable({ data }: RecentlyReturnedTableProps) {
  const getStatusBadge = (status: string) => {
    // Display "STATUS" records as "RETURNED" for consistency
    const displayStatus = status === "STATUS" ? "RETURNED" : status;
    
    return (
      <Badge 
        variant="outline" 
        className="border-green-200 bg-green-100 text-green-800"
      >
        {displayStatus}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Returned Books</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((returnRecord) => (
              <TableRow key={returnRecord.id}>
                <TableCell className="font-medium">{returnRecord.bookTitle || 'Unknown Book'}</TableCell>
                <TableCell>{returnRecord.borrowerName || 'Unknown User'}</TableCell>
                <TableCell>
                  {returnRecord.returnDate ? format(returnRecord.returnDate, 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(returnRecord.status)}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No recently returned books
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}