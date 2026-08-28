"use client";

/**
 * components/notifications/NotificationsListActions.tsx
 *
 * Client island for the /notifications page. The page itself is a server
 * component (URL-driven like /announcements); this island adds the interactive
 * pieces:
 *  - MarkAllNotificationsButton -> server action + router.refresh() so the
 *    server-rendered list, filter counts and badge state update without a
 *    full page reload.
 *  - NotificationItem -> optimistic mark-as-read, then navigate to the
 *    notification's server-generated internal link.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Inbox, Loader2, Megaphone } from "lucide-react";

import {
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  type UserNotificationRow,
} from "@/lib/actions/notifications";
import { userNotificationTypeConfig } from "@/constants";
import { cn, formatRelativeTime } from "@/lib/utils";

const TYPE_ICONS = {
  ANNOUNCEMENT: Megaphone,
  NEW_BOOK: BookOpen,
} as const;

export function MarkAllNotificationsButton({
  unreadCount,
}: {
  unreadCount: number;
}) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAll = async () => {
    setIsMarking(true);
    try {
      const result = await markAllUserNotificationsAsRead();
      if (result.success) {
        // Re-render the server component so the list and tab counts update
        // without a full page reload.
        router.refresh();
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMarkAll}
      disabled={isMarking || unreadCount === 0}
      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-all duration-200 hover:bg-amber-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
    >
      {isMarking && <Loader2 className="h-4 w-4 animate-spin" />}
      Mark all as read
    </button>
  );
}

export function NotificationItem({ item }: { item: UserNotificationRow }) {
  const router = useRouter();

  const config = userNotificationTypeConfig[item.type] ?? {
    label: "Notification",
    accentBg: "bg-gray-100 dark:bg-gray-800",
    accentText: "text-gray-600 dark:text-gray-300",
  };
  const IconComponent =
    TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] ?? Inbox;

  const handleClick = () => {
    if (!item.isRead) {
      // Optimistic: the action is dispatched before navigation and completes
      // server-side regardless of the route change.
      markUserNotificationAsRead(item.id).catch(() => {});
    }

    // Only ever follow server-generated internal routes.
    if (item.link && item.link.startsWith("/")) {
      router.push(item.link);
    } else {
      // No destination — settle the read state visually instead.
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-md active:scale-[0.995]",
        item.isRead
          ? "border-light-300 bg-white dark:border-dark-300 dark:bg-gray-800"
          : "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/10",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          config.accentBg,
        )}
      >
        <IconComponent className={cn("h-4 w-4", config.accentText)} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {!item.isRead && (
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
            />
          )}
          <span
            className={cn(
              "truncate text-sm",
              item.isRead
                ? "font-normal text-gray-700 dark:text-gray-300"
                : "font-medium text-gray-900 dark:text-white",
            )}
          >
            {item.title}
          </span>
        </span>
        <span className="mt-1 line-clamp-2 block break-words text-sm text-gray-500 dark:text-gray-400">
          {item.message}
        </span>
        <span className="mt-1.5 block text-xs text-gray-400 dark:text-gray-500">
          {formatRelativeTime(item.createdAt)}
        </span>
      </span>
    </button>
  );
}