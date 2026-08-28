// components/admin/announcements/AnnouncementsCenter.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  getAnnouncements,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  type AnnouncementRow,
} from "@/lib/admin/actions/announcements";
import { announcementStatuses } from "@/constants";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Loader2,
  Pencil,
  Send,
  Archive,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
};

const getStatusConfig = (value: string) =>
  announcementStatuses.find((s) => s.value === value) ??
  announcementStatuses[0];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function AnnouncementsCenter() {
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  // Default sort MUST match what the server returns: getAnnouncements orders
  // by createdAt DESC unless sort === "oldest", so first load is newest-first.
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AnnouncementRow | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);

  // Debounce search so we do not hit the server on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAnnouncements({
        status: statusFilter,
        search: debouncedSearch,
        dateRange: dateFilter,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      if (!result.success || !result.data) {
        throw new Error("Failed to load announcements");
      }
      setItems(result.data);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading announcements",
      );
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dateFilter, sort, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePublish = async (item: AnnouncementRow) => {
    setIsProcessing(item.id);
    try {
      const result = await publishAnnouncement(item.id);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to publish announcement");
      }
      toast.success("Announcement published");
      await fetchItems();
    } catch (err) {
      console.error("Error publishing announcement:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to publish announcement",
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleArchive = async (item: AnnouncementRow) => {
    setIsProcessing(item.id);
    try {
      const result = await archiveAnnouncement(item.id);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to archive announcement");
      }
      toast.success("Announcement archived");
      await fetchItems();
    } catch (err) {
      console.error("Error archiving announcement:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to archive announcement",
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setIsProcessing(target.id);
    try {
      const result = await deleteAnnouncement(target.id);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to delete announcement");
      }
      toast.success("Announcement deleted");
      setDeleting(null);
      // If the last item of the last page was removed, step back one page.
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchItems();
      }
    } catch (err) {
      console.error("Error deleting announcement:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete announcement",
      );
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status tabs (All is a UI-only filter, never a DB value). */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              statusFilter === tab.value
                ? "border-primary-admin bg-primary-admin text-white dark:border-blue-600 dark:bg-blue-600"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={dateFilter}
            onValueChange={(v) => {
              setDateFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest → Oldest</SelectItem>
              <SelectItem value="oldest">Oldest → Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="ml-2">Loading announcements...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <Megaphone className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
            No announcements found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            {debouncedSearch || statusFilter !== "all" || dateFilter !== "all"
              ? "There are no announcements matching your filters."
              : "Create your first announcement to keep library users informed."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  const busy = isProcessing === item.id;
                  return (
                    <TableRow
                      key={item.id}
                      className="border-b border-light-300 dark:border-dark-300"
                    >
                      <TableCell className="max-w-xs">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {item.content}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            statusConfig.bgColor,
                            statusConfig.textColor,
                          )}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(item.publishedAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(item.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit doubles as "View" for archived rows. */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            asChild
                          >
                            <Link
                              href={`/admin/announcements/edit/${item.id}`}
                              aria-label="Edit announcement"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>

                          {(item.status === "DRAFT" ||
                            item.status === "ARCHIVED") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              onClick={() => handlePublish(item)}
                              disabled={busy}
                              aria-label={
                                item.status === "ARCHIVED"
                                  ? "Restore announcement"
                                  : "Publish announcement"
                              }
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {item.status === "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700"
                              onClick={() => handleArchive(item)}
                              disabled={busy}
                              aria-label="Archive announcement"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {/* Delete is available for drafts and archived rows;
                              a published announcement must be archived first
                              so history is never destroyed in one click. */}
                          {item.status !== "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => setDeleting(item)}
                              disabled={busy}
                              aria-label="Delete announcement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex}–{endIndex} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Permanent-delete confirmation. */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deleting?.title}”. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
