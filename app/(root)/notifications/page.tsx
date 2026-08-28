// app/(root)/notifications/page.tsx
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";

import {
  getUnreadUserNotificationCount,
  getUserNotifications,
} from "@/lib/actions/notifications";
import {
  MarkAllNotificationsButton,
  NotificationItem,
} from "@/components/notifications/NotificationsListActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchParams {
  filter?: string;
  page?: string;
}

const PAGE_SIZE = 15;

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const { filter: filterParam, page: pageParam } = await searchParams;
  const filter = filterParam === "unread" ? "unread" : "all";
  const page = Math.max(1, Number(pageParam) || 1);

  // Session-scoped: both actions resolve the signed-in user server-side.
  const [result, unreadCount] = await Promise.all([
    getUserNotifications({ filter, page, pageSize: PAGE_SIZE }),
    getUnreadUserNotificationCount(),
  ]);

  const items = result.data ?? [];
  const total = result.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (targetFilter: string, targetPage: number) => {
    const params = new URLSearchParams();
    params.set("filter", targetFilter);
    params.set("page", String(targetPage));
    return `/notifications?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stay updated with activity from Smart Library.
            </p>
          </div>
        </div>

        <MarkAllNotificationsButton unreadCount={unreadCount} />
      </div>

      {/* Filter tabs (URL-driven, like the announcements feed) */}
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={buildHref("all", 1)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            filter === "all"
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-light-300 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 dark:border-dark-300 dark:bg-gray-800 dark:text-gray-300",
          )}
        >
          All
        </Link>
        <Link
          href={buildHref("unread", 1)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            filter === "unread"
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-light-300 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 dark:border-dark-300 dark:bg-gray-800 dark:text-gray-300",
          )}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Link>
      </div>

      {/* List */}
      {!result.success ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-16 text-center dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-medium text-red-600 dark:text-red-300">
            Something went wrong loading your notifications.
          </p>
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">
            Please refresh the page to try again.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-light-300 py-20 text-center dark:border-dark-300">
          <Bell className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No notifications yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            We&apos;ll let you know when there&apos;s something new from Smart
            Library.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.success && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" asChild={page > 1}>
            {page > 1 ? (
              <Link href={buildHref(filter, page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" /> Previous
              </span>
            )}
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" asChild={page < totalPages}>
            {page < totalPages ? (
              <Link href={buildHref(filter, page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Page;