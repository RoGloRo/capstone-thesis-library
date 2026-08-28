// components/admin/notifications/NotificationsCenter.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationRow,
} from "@/lib/admin/actions/notifications";
import {
  notificationCategories,
  notificationTypeOptions,
  notificationTypeDetails,
  notificationCategoryBadge,
  notificationEntityRoutes,
} from "@/constants";
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
  CheckCheck,
  Loader2,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const relativeTime = (iso: string) => {
  try {
    const then = new Date(iso).getTime();
    const diffSec = Math.round((Date.now() - then) / 1000);
    if (Number.isNaN(diffSec) || diffSec < 0) return iso;
    if (diffSec < 60) return "just now";
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function NotificationsCenter() {
  const router = useRouter();

  const [category, setCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [readFilter, setReadFilter] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  // Default sort MUST match what the server actually returns on the initial
  // load: getNotifications() orders by desc(createdAt) when sort === "latest"
  // (its own default), so the very first query is genuinely newest-first.
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, total);

  const typeOptions =
    notificationTypeOptions[category] ?? notificationTypeOptions.ALL;

  // Debounce search so we do not hit the server on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications({
        category,
        search: debouncedSearch,
        read: readFilter,
        eventType,
        dateRange: dateFilter,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      if (!result.success || !result.data) {
        throw new Error("Failed to load notifications");
      }
      setItems(result.data);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading notifications",
      );
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, readFilter, eventType, dateFilter, sort, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCategory = (value: string) => {
    setCategory(value);
    setEventType("all");
    setPage(1);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      const result = await markAllNotificationsAsRead();
      if (!result.success) {
        throw new Error("Failed to mark all as read");
      }
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all as read:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to mark all as read",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (item: NotificationRow) => {
    // Mark read (optimistically) when an unread notification is clicked.
    if (!item.isRead) {
      markNotificationAsRead(item.id)
        .then(() => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, isRead: true } : it,
            ),
          );
        })
        .catch((err) => console.error("Error marking notification read:", err));
    }

    // Navigate toward the related record when there is a known route.
    const route = item.entityType
      ? notificationEntityRoutes[item.entityType]
      : null;
    if (route) {
      router.push(route);
    }
  };

  return (
    <div className="space-y-4">
{/* Category tabs (All is a UI-only filter, never a DB category). */}
      <div className="flex flex-wrap gap-2">
        {notificationCategories.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => handleCategory(c.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              category === c.value
                ? "border-primary-admin bg-primary-admin text-white dark:border-blue-600 dark:bg-blue-600"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search notifications..."
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
              value={readFilter}
              onValueChange={(v) => {
                setReadFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={eventType}
              onValueChange={(v) => {
                setEventType(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={dateFilter}
              onValueChange={(v) => {
                setDateFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest → Oldest</SelectItem>
                <SelectItem value="oldest">Oldest → Latest</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAll}
              disabled={markingAll || total === 0}
              className="inline-flex items-center gap-1"
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all as read
            </Button>
          </div>
        </div>
      </div>
{/* Notification feed */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="ml-2">Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
            No notifications found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            There are no notifications matching your filters.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => {
              const type = notificationTypeDetails[item.type] ?? {
                label: item.type,
                emoji: "🔔",
              };
              const catBadge = notificationCategoryBadge[item.category] ?? null;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors",
                      item.isRead
                        ? "border-gray-200 bg-white opacity-80 dark:border-gray-700 dark:bg-gray-800"
                        : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 flex w-3 shrink-0 justify-center">
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base leading-none">
                            {type.emoji}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              item.isRead
                                ? "text-gray-700 dark:text-gray-300"
                                : "text-gray-900 dark:text-white",
                            )}
                          >
                            {type.label}
                          </span>
                          {catBadge && (
                            <Badge
                              variant="secondary"
                              className={cn(catBadge.bgColor, catBadge.textColor)}
                            >
                              {catBadge.label}
                            </Badge>
                          )}
                          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-400">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 py-2 sm:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex}&ndash;{endIndex} of {total} notifications
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-2 text-sm font-medium dark:text-white">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}