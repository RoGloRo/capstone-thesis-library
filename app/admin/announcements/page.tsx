// app/admin/announcements/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AnnouncementsCenter from "@/components/admin/announcements/AnnouncementsCenter";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <section className="w-full rounded-2xl bg-white dark:bg-gray-800 p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold dark:text-white">Announcements</h2>
        <Button asChild>
          <Link href="/admin/announcements/new">
            <Plus className="size-5" /> Create Announcement
          </Link>
        </Button>
      </div>

      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Create and manage announcements for library users. Only published
        announcements are visible to students.
      </p>

      <div className="mt-7 w-full">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="ml-2">Loading announcements...</span>
            </div>
          }
        >
          <AnnouncementsCenter />
        </Suspense>
      </div>
    </section>
  );
}