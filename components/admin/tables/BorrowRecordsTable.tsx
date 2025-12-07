// components/admin/tables/BorrowRecordsTable.tsx
"use client";

import { useEffect, useState } from "react";
import { getBorrowRecords } from "@/lib/admin/actions/borrow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { BorrowRecord } from "@/types/borrow";

export default function BorrowRecordsTable() {
  // Remove the duplicate state declaration
const [records, setRecords] = useState<BorrowRecord[]>([]);
const [filteredRecords, setFilteredRecords] = useState<BorrowRecord[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [viewingCard, setViewingCard] = useState<{ name: string; cardUrl: string } | null>(null);
  // Update the getImageUrl function in BorrowRecordsTable.tsx
const getImageUrl = (url: string | null) => {
  if (!url) return null;
  
  // If it's already a full URL, use it as is
  if (url.startsWith('http')) return url;
  
  // If it starts with a forward slash, it's a relative path from the root
  if (url.startsWith('/')) {
    return `https://ik.imagekit.io/jsmasterylemor${url}`;
  }
  
  // Otherwise, assume it's a filename in the /ids/ directory
  return `https://ik.imagekit.io/jsmasterylemor/ids/${url}`;
};
  
// Add this effect for data fetching
useEffect(() => {
  const fetchRecords = async () => {
    try {
      const result = await getBorrowRecords();
      if (result.success) {
        setRecords(result.data || []);
        setFilteredRecords(result.data || []);
      } else {
        setError(result.message || "Failed to load records");
      }
    } catch (err) {
      console.error("Error fetching records:", err);
      setError("An error occurred while fetching records");
    } finally {
      setLoading(false);
    }
  };

  fetchRecords();
  
  // Refresh data every 60 seconds
  const interval = setInterval(fetchRecords, 60000);
  
  return () => clearInterval(interval);
}, []);

// Keep the search effect separate
useEffect(() => {
  if (!searchTerm.trim()) {
    setFilteredRecords(records);
    return;
  }

  const term = searchTerm.toLowerCase();
  const filtered = records.filter(record => {
    return (
      (record.userName?.toLowerCase().includes(term)) ||
      (record.userEmail?.toLowerCase().includes(term)) ||
      (record.universityId?.toString().includes(term)) ||
      (record.bookTitle?.toLowerCase().includes(term)) ||
      (record.bookAuthor?.toLowerCase().includes(term))
    );
  });

  setFilteredRecords(filtered);
}, [searchTerm, records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2">Loading records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading records
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              No records found
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>There are no borrow records to display.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BORROWED":
        return <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">Borrowed</Badge>;
      case "RETURNED":
        return <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">Returned</Badge>;
      case "OVERDUE":
        return <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

 return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, ID, or book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>University ID</TableHead>
              <TableHead>University Card</TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Borrowed On</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Returned On</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{record.userName || "Unknown User"}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.userEmail || "No email"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{record.universityId || "-"}</TableCell>
                <TableCell>
                  {record.universityCard ? (
                    <button
                      onClick={() => 
                        setViewingCard({
                          name: record.userName || "User",
                          cardUrl: record.universityCard
                        })
                      }
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Card
                    </button>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{record.bookTitle || "Unknown Book"}</div>
                    <div className="text-sm text-muted-foreground">
                      by {record.bookAuthor || "Unknown Author"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(record.borrowDate)}</TableCell>
                <TableCell>{formatDate(record.dueDate)}</TableCell>
                <TableCell>{formatDate(record.returnDate)}</TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRecords.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No matching records found" : "No records available"}
          </div>
        )}
      </div>

      {/* University Card Modal */}
      <Dialog
        open={!!viewingCard}
        onOpenChange={(open) => !open && setViewingCard(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCard?.name}'s University Card</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full">
            {viewingCard?.cardUrl ? (
              <Image
                src={getImageUrl(viewingCard.cardUrl) || ''}
                alt={`${viewingCard.name}'s University Card`}
                fill
                className="rounded-md object-contain"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Show the fallback message
                  const fallback = document.createElement('div');
                  fallback.className = 'absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-400';
                  fallback.textContent = 'Image not available';
                  target.parentNode?.appendChild(fallback);
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
                No card image available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}