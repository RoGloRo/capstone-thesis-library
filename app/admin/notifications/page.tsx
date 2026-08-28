// app/admin/notifications/page.tsx
import { Suspense } from "react";
import NotificationsCenter from "@/components/admin/notifications/NotificationsCenter";

export default function Page() {
  return (
    <section className="w-full rounded-2xl bg-white dark:bg-gray-800 p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold dark:text-white">Notifications</h2>
      </div>

      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Stay updated with important library activity.
      </p>

      <div className="mt-7 w-full">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="ml-2">Loading notifications...</span>
            </div>
          }
        >
          <NotificationsCenter />
        </Suspense>
      </div>
    </section>
  );
}