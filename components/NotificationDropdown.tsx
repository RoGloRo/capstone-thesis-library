"use client";

/**
 * components/NotificationDropdown.tsx
 *
 * Layer 1 of the User Notification Center: the header bell + quick-preview
 * popover. The popover is a COMPACT preview (newest items, unread indicator,
 * "Mark all as read") plus a "View all notifications" action that navigates to
 * /notifications — the full history/management page (Layer 2).
 *
 * Data comes from the session-scoped user_notifications inbox (server actions
 * in lib/actions/notifications.ts) — NOT from email_logs and NOT from the
 * admin notifications feed.
 *
 * Built on the existing Radix popover primitive so the panel can never escape
 * the viewport (built-in collision avoidance), closes on Escape/outside click,
 * and manages focus correctly on desktop, tablet and mobile.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, BookOpen, Inbox, Megaphone } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUnreadUserNotificationCount,
  getUserNotifications,
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  type UserNotificationRow,
} from "@/lib/actions/notifications";
import { userNotificationTypeConfig } from "@/constants";
import { cn, formatRelativeTime } from "@/lib/utils";

const PREVIEW_LIMIT = 6;

const TYPE_ICONS = {
  ANNOUNCEMENT: Megaphone,
  NEW_BOOK: BookOpen,
} as const;

export default function NotificationDropdown() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<UserNotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const wasOpenRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    try {
      setUnreadCount(await getUnreadUserNotificationCount());
    } catch {
      // The badge is auxiliary — a failed count must never break the bell.
    }
  }, []);

  // Keep the badge honest even while the popover is closed.
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUserNotifications({
        page: 1,
        pageSize: PREVIEW_LIMIT,
      });
      if (!result.success || !result.data) {
        throw new Error("Failed to load notifications");
      }
      setItems(result.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // (Re)fetch every time the popover opens so the preview is never stale.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      fetchItems();
      refreshUnread();
    }
    wasOpenRef.current = open;
  }, [open, fetchItems, refreshUnread]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      const result = await markAllUserNotificationsAsRead();
      if (!result.success) {
        throw new Error("Failed to mark all as read");
      }
      // Optimistic local update — no reload needed.
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = (item: UserNotificationRow) => {
    setOpen(false);

    if (!item.isRead) {
      // Mark first (optimistically), then navigate immediately: the server
      // action is already dispatched, so it completes even after the route
      // change, and the badge is correct when the user comes back.
      markUserNotificationAsRead(item.id)
        .then(() => refreshUnread())
        .catch(() => {});
    }

    // Only ever follow server-generated internal routes.
    if (item.link && item.link.startsWith("/")) {
      router.push(item.link);
      return;
    }
    router.push("/notifications");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          aria-haspopup="dialog"
          className={cn(
            "relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 touch-manipulation",
            open
              ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
              : "text-gray-600 hover:bg-amber-50 hover:text-amber-500 dark:text-gray-300 dark:hover:bg-amber-900/20",
          )}
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white shadow-sm sm:h-5 sm:min-w-[1.25rem] sm:text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl border-gray-200/80 bg-white p-0 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-3 dark:border-gray-800 sm:p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
            Notifications
          </h3>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || unreadCount === 0}
            className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[24rem] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="mx-auto mb-2 h-7 w-7 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400 sm:text-sm">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchItems}
                className="mt-2 rounded-lg bg-red-100 px-3 py-1 text-xs text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center sm:p-8">
              <Bell className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600 sm:h-10 sm:w-10" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:text-base">
                You&apos;re all caught up!
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 sm:text-sm">
                No new notifications.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => {
                const config = userNotificationTypeConfig[item.type] ?? {
                  label: "Notification",
                  accentBg: "bg-gray-100 dark:bg-gray-800",
                  accentText: "text-gray-600 dark:text-gray-300",
                };
                const IconComponent =
                  TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] ?? Inbox;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex w-full items-start gap-2 p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 sm:gap-3 sm:p-4",
                      !item.isRead && "bg-amber-50/60 dark:bg-amber-900/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
                        config.accentBg,
                      )}
                    >
                      <IconComponent
                        className={cn("h-3 w-3 sm:h-4 sm:w-4", config.accentText)}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="mb-0.5 flex items-center gap-1.5">
                        {!item.isRead && (
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                          />
                        )}
                        <span
                          className={cn(
                            "truncate text-xs font-medium sm:text-sm",
                            item.isRead
                              ? "text-gray-700 dark:text-gray-300"
                              : "text-gray-900 dark:text-white",
                          )}
                        >
                          {item.title}
                        </span>
                      </span>
                      <span className="line-clamp-2 block break-words text-xs text-gray-500 dark:text-gray-400">
                        {item.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-gray-400 dark:text-gray-500 sm:text-[11px]">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — the bridge to the full history page. */}
        <div className="border-t border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800 sm:p-3">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg py-2 text-center text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30 sm:text-sm"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
