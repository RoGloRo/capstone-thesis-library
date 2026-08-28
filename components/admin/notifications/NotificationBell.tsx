"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/lib/admin/actions/notifications";

/**
 * Header bell for the Admin Notification Center. It only displays the unread
 * count and links to /admin/notifications — it is NOT a second notification UI.
 * Unauthorized callers always receive 0 from the guarded server action.
 */
export default function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getUnreadNotificationCount()
      .then((c) => {
        if (active) setCount(c);
      })
      .catch(() => {
        if (active) setCount(0);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link
      href="/admin/notifications"
      className="relative flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300"
      title="Notifications"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {count !== null && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}