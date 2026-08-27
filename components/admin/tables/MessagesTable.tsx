// components/admin/tables/MessagesTable.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAdminMessages,
  updateMessageStatus,
  type AdminMessage,
} from "@/lib/admin/actions/messages";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { messageStatuses } from "@/constants";

const ITEMS_PER_PAGE = 10;

const formatDateTime = (iso: string) => {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
};

const getStatusConfig = (value: string) =>
  messageStatuses.find((s) => s.value === value) ?? messageStatuses[0];

export default function MessagesTable() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Default sort MUST match what the server actually returns.
  // getAdminMessages orders by createdAt DESC whenever sortOrder ===
  // "latest" (its own default), so the initial render is genuinely
  // Latest -> Oldest. Passing the live selection on EVERY fetch removes
  // any chance of the label/data mismatch seen on other admin tables.
  const [selectedSort, setSelectedSort] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewingMessage, setViewingMessage] = useState<AdminMessage | null>(null);

  const totalPages = Math.max(1, Math.ceil(messages.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, messages.length);
  const currentRows = messages.slice(startIndex, endIndex);

  // Debounce search so we do not hit the server on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminMessages(
        debouncedSearchTerm,
        statusFilter,
        selectedSort,
      );

      if (!result.success || !result.data) {
        throw new Error("Failed to load messages");
      }

      setMessages(result.data);
      setTotal(result.total ?? result.data.length);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while fetching messages";
      setError(errorMessage);
      toast.error(errorMessage);
      setMessages([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, selectedSort]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Server-side filtering/sorting change -> refetch with the same options.
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Status management. Applied optimistically against local state after the
  // action succeeds (the action also revalidates the path server-side).
  const handleUpdateStatus = async (
    messageId: string,
    newStatus: string,
  ) => {
    setIsProcessing(messageId);
    try {
      const result = await updateMessageStatus(messageId, newStatus);

      if (!result.success) {
        throw new Error(result.error ?? "Failed to update status");
      }

      const nowIso = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, status: newStatus as AdminMessage["status"], updatedAt: nowIso }
            : m,
        ),
      );
      setViewingMessage((prev) =>
        prev && prev.id === messageId
          ? { ...prev, status: newStatus as AdminMessage["status"], updatedAt: nowIso }
          : prev,
      );

      toast.success(`Marked as ${getStatusConfig(newStatus).label}`);
    } catch (err) {
      console.error("Error updating message status:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update the message status",
      );
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search / Filter / Sort controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search name, email, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {messageStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest &rarr; Oldest</SelectItem>
              <SelectItem value="oldest">Oldest &rarr; Latest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading messages...</span>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-500 font-medium">
            Something went wrong while loading messages.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <Inbox className="h-6 w-6 text-gray-400" />
          </div>
          <p className="mt-3 text-lg font-medium dark:text-white">
            No messages found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {debouncedSearchTerm || statusFilter !== "all"
              ? "No results match your search or filter."
              : "No Contact Us messages have been submitted yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Messages table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((m) => {
                  const status = getStatusConfig(m.status);
                  return (
                    <TableRow
                      key={m.id}
                      onClick={() => setViewingMessage(m)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font-medium dark:text-gray-200">
                        {m.name}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {m.email}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {/* Plain-text preview only — user input is never
                            rendered as HTML anywhere in this page. */}
                        <p className="truncate text-gray-600 dark:text-gray-400">
                          {m.message}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${status.bgColor} ${status.textColor}`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1"
                          onClick={() => setViewingMessage(m)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {endIndex} of {messages.length}{' '}
              messages ({total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-medium px-2 dark:text-white">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                type="button"
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
        </>
      )}

      {/* Full message details dialog */}
      <Dialog
        open={!!viewingMessage}
        onOpenChange={(open) => !open && setViewingMessage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {viewingMessage && (
            <>
              <DialogHeader>
                <DialogTitle>Message Details</DialogTitle>
              </DialogHeader>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div>
                  <p className="text-sm font-semibold dark:text-white">
                    {viewingMessage.name}
                  </p>
                  <a
                    href={`mailto:${viewingMessage.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {viewingMessage.email}
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    {(() => {
                      const cfg = getStatusConfig(viewingMessage.status);
                      return (
                        <Badge
                          variant="secondary"
                          className={`${cfg.bgColor} ${cfg.textColor}`}
                        >
                          {cfg.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Change status</p>
                    <Select
                      value={viewingMessage.status}
                      onValueChange={(value) =>
                        handleUpdateStatus(viewingMessage.id, value)
                      }
                      disabled={isProcessing === viewingMessage.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        {messageStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="dark:text-gray-200">
                      {formatDateTime(viewingMessage.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last updated</p>
                    <p className="dark:text-gray-200">
                      {formatDateTime(viewingMessage.updatedAt)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">User account</p>
                  <p className="text-sm dark:text-gray-200">
                    {viewingMessage.userId
                      ? `${viewingMessage.userName ?? "Unknown"} (${viewingMessage.userEmail ?? "no email"}) - ID: ${viewingMessage.userId}`
                      : "Guest submission (no linked account)"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-500">Message</p>
                  {/* Plain text rendering only (whitespace-pre-wrap). Never
                      dangerouslySetInnerHTML — XSS-safe by construction. */}
                  <div className="rounded-md border bg-gray-50 p-3 text-sm whitespace-pre-wrap break-words dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200">
                    {viewingMessage.message}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
