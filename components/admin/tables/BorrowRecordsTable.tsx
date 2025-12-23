// components/admin/tables/BorrowRecordsTable.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { BorrowRecord } from "@/types/borrow";
import { generatePDFReceipt, calculateLoanDuration, determineLoanStatus, formatDisplayDate } from "@/lib/pdf-receipt";
import { toast } from "sonner";

export default function BorrowRecordsTable() {
  // Remove the duplicate state declaration
const [records, setRecords] = useState<BorrowRecord[]>([]);
const [filteredRecords, setFilteredRecords] = useState<BorrowRecord[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [selectedSort, setSelectedSort] = useState<string>("latest");
const [currentPage, setCurrentPage] = useState(1);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [viewingCard, setViewingCard] = useState<{ name: string; cardUrl: string } | null>(null);
const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

const itemsPerPage = 10;
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

// Handle sort dropdown changes
const handleSortChange = useCallback((value: string) => {
  setSelectedSort(value);
  setCurrentPage(1); // Reset to first page when sorting
}, []);

// Calculate pagination
const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentRecords = filteredRecords.slice(startIndex, endIndex);

const handlePreviousPage = () => {
  setCurrentPage(prev => Math.max(prev - 1, 1));
};

const handleNextPage = () => {
  setCurrentPage(prev => Math.min(prev + 1, totalPages));
};
  
// Add this effect for data fetching
useEffect(() => {
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await getBorrowRecords();
      if (result.success && result.data) {
        setRecords(result.data);
        setFilteredRecords(result.data);
      } else {
        setError(result.error || "Failed to load records");
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
  let filtered = records;
  
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filtered = records.filter(record => {
      return (
        (record.userName?.toLowerCase().includes(term)) ||
        (record.userEmail?.toLowerCase().includes(term)) ||
        (record.universityId?.toString().includes(term)) ||
        (record.bookTitle?.toLowerCase().includes(term)) ||
        (record.bookAuthor?.toLowerCase().includes(term))
      );
    });
  }

  // Apply sorting
  const sortedRecords = [...filtered];
  switch (selectedSort) {
    case 'latest':
      sortedRecords.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
      break;
    case 'oldest':
      sortedRecords.sort((a, b) => new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime());
      break;
    case 'due-soon':
      sortedRecords.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      break;
    case 'user-name':
      sortedRecords.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
      break;
    default:
      break;
  }
  
  setFilteredRecords(sortedRecords);
  setCurrentPage(1); // Reset to first page when searching or sorting
}, [searchTerm, records, selectedSort]);

  const handleDownloadReceipt = async (record: BorrowRecord) => {
    // Validate required data
    if (!record.userName || !record.userEmail || !record.bookTitle || !record.bookAuthor || !record.borrowDate || !record.dueDate) {
      toast.error('Receipt Error', {
        description: 'Unable to generate receipt. Missing required loan or user information.'
      });
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(record.id));
    
    try {
      const loanDuration = calculateLoanDuration(record.borrowDate.toString(), record.dueDate.toString());
      const status = determineLoanStatus(record.dueDate.toString(), record.returnDate?.toString() || null);

      const receiptData = {
        // User Information
        userName: record.userName,
        userEmail: record.userEmail,
        universityId: record.universityId || undefined,
        
        // Book Information
        bookTitle: record.bookTitle,
        bookAuthor: record.bookAuthor,
        bookGenre: 'General', // Default genre as it's not available in borrow records
        
        // Loan Information
        borrowDate: formatDisplayDate(record.borrowDate.toString()),
        dueDate: formatDisplayDate(record.dueDate.toString()),
        returnDate: record.returnDate ? formatDisplayDate(record.returnDate.toString()) : null,
        loanDuration,
        status
      };

      generatePDFReceipt(receiptData);
      
      toast.success('Receipt Downloaded', {
        description: `Receipt for "${record.bookTitle}" has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      toast.error('Download Failed', {
        description: 'There was an error generating the receipt. Please try again.'
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(record.id);
        return newSet;
      });
    }
  };

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
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BORROWED":
        return <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">Borrowed</Badge>;
      case "RETURNED":
      case "STATUS": // Display "STATUS" records as "RETURNED" for consistency
        return <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">Returned</Badge>;
      case "OVERDUE":
        return <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

 return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, ID, or book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select sorting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Borrowed</SelectItem>
              <SelectItem value="oldest">Oldest Borrowed</SelectItem>
              <SelectItem value="due-soon">Due Date (Soon)</SelectItem>
              <SelectItem value="user-name">User Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRecords.map((record) => (
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
                          cardUrl: record.universityCard || ""
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
                <TableCell>{record.returnDate ? formatDate(record.returnDate) : "-"}</TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-2 h-auto text-xs font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={downloadingIds.has(record.id)}
                    onClick={() => handleDownloadReceipt(record)}
                    title={downloadingIds.has(record.id) ? "Generating receipt..." : "Download Receipt"}
                  >
                    <Download className={`h-3.5 w-3.5 ${downloadingIds.has(record.id) ? 'animate-spin' : ''}`} />
                    {downloadingIds.has(record.id) ? 'Generating...' : 'Receipt'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRecords.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">No records found</p>
            <p className="text-gray-500 text-sm">
              {searchTerm 
                ? `No results match "${searchTerm}"` 
                : "No borrow records available at the moment"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredRecords.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} records
            {searchTerm && (
              <span className="ml-2 text-blue-600 font-medium">
                (filtered from {records.length} total)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* University Card Modal */}
      <Dialog
        open={!!viewingCard}
        onOpenChange={(open) => !open && setViewingCard(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingCard?.name}&apos;s University Card</DialogTitle>
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