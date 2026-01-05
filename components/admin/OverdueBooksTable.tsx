"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Mail, Loader2, AlertTriangle } from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const handleSendOverdueEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workflows/daily-overdue-penalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success(`Overdue email notifications sent to ${data.length} borrowers`);
        setShowModal(false);
      } else {
        toast.error('Failed to send overdue emails');
      }
    } catch (error) {
      console.error('Failed to send overdue emails:', error);
      toast.error('Failed to send overdue emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-gray-700">
              <TableHead className="text-gray-700 dark:text-gray-300">Title</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Borrower</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Borrowed Date</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Due Date</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Days Overdue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((book) => (
              <TableRow 
                key={book.id} 
                className="bg-red-50 dark:bg-red-900/20 border-gray-200 dark:border-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  {book.bookTitle || 'Unknown Book'}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {book.borrowerName || 'Unknown User'}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {format(book.borrowDate, 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {book.dueDate}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800">
                    {book.daysOverdue} days
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={5} 
                  className="h-24 text-center text-gray-500 dark:text-gray-400"
                >
                  No overdue books found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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