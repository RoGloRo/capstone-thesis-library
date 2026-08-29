"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface OverdueBook {
  id: string;
  bookTitle: string | null;
  borrowerName: string | null;
  borrowerEmail: string | null;
  borrowDate: Date;
  dueDate: string;
  daysOverdue: number;
}

interface OverdueBooksTableProps {
  data: OverdueBook[];
}

export function OverdueBooksTable({ data }: OverdueBooksTableProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const handleSendOverdueEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workflows/manual-overdue-notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        const queued = result.totalRecipients || data.length;
        toast.success(`Overdue email notifications queued for ${queued} borrower(s)`);
        setShowModal(false);
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.error || "Failed to queue overdue emails");
      }
    } catch (error) {
      console.error("Failed to send overdue emails:", error);
      toast.error("Failed to send overdue emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 gap-4 flex-wrap">
          <CardTitle className="text-red-600 dark:text-red-400">Overdue Books</CardTitle>
          {data.length > 0 && (
            <Button
              onClick={handleButtonClick}
              disabled={loading}
              size="sm"
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Overdue Emails
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="flex h-[140px] items-center justify-center rounded-lg border border-dashed">
              <div className="px-4 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500/80" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  No overdue books — all loans are on time.
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
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((book) => (
                    <TableRow
                      key={book.id}
                      className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <TableCell className="font-medium">
                        <span className="block max-w-[240px] truncate" title={book.bookTitle ?? ""}>
                          {book.bookTitle || "Unknown Book"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-[180px] truncate" title={book.borrowerName ?? ""}>
                          {book.borrowerName || "Unknown User"}
                        </span>
                      </TableCell>
                      <TableCell>{format(book.borrowDate, "MMM d, yyyy")}</TableCell>
                      <TableCell>{book.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-300">
                          {book.daysOverdue} day{book.daysOverdue === 1 ? "" : "s"}
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
{/* Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Send Overdue Email Notifications
            </DialogTitle>
            <DialogDescription className="text-left">
              This will send overdue notification emails to all {data.length} borrowers with overdue books.
              These emails will inform them about their overdue status and any applicable penalties.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Are you sure you want to send overdue notifications to {data.length} borrowers?
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSendOverdueEmails}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send {data.length} Email(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}