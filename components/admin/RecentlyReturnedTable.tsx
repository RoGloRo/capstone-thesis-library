"use client";

import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecentReturn {
  id: string;
  bookTitle: string | null;
  borrowerName: string | null;
  returnDate: string | null;
  borrowDate: Date;
  derivedStatus: "Returned";
}

interface RecentlyReturnedTableProps {
  data: RecentReturn[];
}

export function RecentlyReturnedTable({ data }: RecentlyReturnedTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Recently Returned Books</CardTitle>
        <CardDescription>Latest return activity</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <RotateCcw className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">No returned books yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Returned books will appear here as students bring books back.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Returned Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <span className="block max-w-[240px] truncate" title={record.bookTitle ?? ""}>
                        {record.bookTitle || "Unknown Book"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[180px] truncate" title={record.borrowerName ?? ""}>
                        {record.borrowerName || "Unknown User"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.returnDate
                        ? format(new Date(`${record.returnDate}T00:00:00`), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300">
                        Returned
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}