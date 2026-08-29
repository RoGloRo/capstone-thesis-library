"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, Loader2, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generatePDFReceipt } from "@/lib/pdf-receipt";
import type { DerivedLoanStatus } from "@/app/admin/utils";

interface RecentBorrow {
  id: string;
  bookTitle: string | null;
  bookAuthor: string | null;
  borrowerName: string | null;
  borrowerEmail: string | null;
  borrowDate: Date;
  dueDate: string;
  returnDate: string | null;
  derivedStatus: DerivedLoanStatus;
}

interface RecentlyBorrowedTableProps {
  data: RecentBorrow[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

function StatusBadge({ status }: { status: DerivedLoanStatus }) {
  if (status === "Returned") {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300">
        Returned
      </Badge>
    );
  }
  if (status === "Overdue") {
    return (
      <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300">
        Overdue
      </Badge>
    );
  }
  return <Badge>Active</Badge>;
}

export function RecentlyBorrowedTable({ data }: RecentlyBorrowedTableProps) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownloadReceipt = async (record: RecentBorrow) => {
    const bookTitle = record.bookTitle ?? "Unknown Book";
    if (!record.borrowerEmail || !bookTitle || !record.borrowDate || !record.dueDate) {
      toast.error("Unable to generate receipt. Missing required loan or user information.");
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(record.id));
    try {
      const due = new Date(`${record.dueDate}T00:00:00`);
      const loanDuration = Math.max(
        1,
        Math.round((due.getTime() - record.borrowDate.getTime()) / 86_400_000)
      );

      generatePDFReceipt({
        userName: record.borrowerName ?? "Unknown User",
        userEmail: record.borrowerEmail,
        bookTitle,
        bookAuthor: record.bookAuthor ?? "",
        bookGenre: "",
        borrowDate: formatDate(record.borrowDate),
        dueDate: formatDate(due),
        returnDate: record.returnDate ? formatDate(record.returnDate) : undefined,
        loanDuration,
        status: record.derivedStatus,
      });
      toast.success(`Receipt for "${bookTitle}" downloaded.`);
    } catch {
      toast.error("There was an error generating the receipt. Please try again.");
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Recently Borrowed Books</CardTitle>
        <CardDescription>Latest borrow events</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed">
            <div className="px-4 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">No borrow activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Borrowed books will appear here as students check books out.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
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
                    <TableCell className="font-medium">
                      <span className="block max-w-[220px] truncate" title={borrow.bookTitle ?? ""}>
                        {borrow.bookTitle || "Unknown Book"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[180px] truncate" title={borrow.borrowerName ?? ""}>
                        {borrow.borrowerName || "Unknown User"}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(borrow.borrowDate)}</TableCell>
                    <TableCell>{formatDate(borrow.dueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={borrow.derivedStatus} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadReceipt(borrow)}
                        disabled={downloadingIds.has(borrow.id)}
                      >
                        {downloadingIds.has(borrow.id) ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Receipt
                      </Button>
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