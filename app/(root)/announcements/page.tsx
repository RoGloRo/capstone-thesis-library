// app/(root)/announcements/page.tsx
import Link from "next/link";
import { Megaphone, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";

import {
  listPublishedAnnouncements,
} from "@/lib/actions/announcements";
import { Button } from "@/components/ui/button";

interface SearchParams {
  search?: string;
  page?: string;
}

const PAGE_SIZE = 9;

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const { search = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  // PUBLISHED-only, enforced inside the action (not just here).
  const result = await listPublishedAnnouncements({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const announcements = result.data ?? [];
  const total = result.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(targetPage));
    return `/announcements?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Announcements
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stay updated with the latest library news and updates.
            </p>
          </div>
        </div>

        {/* Search (GET form — shareable/bookmarkable URLs, no client JS). */}
        <form action="/announcements" className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search announcements..."
              className="w-full rounded-lg border border-light-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-amber-500 dark:border-dark-300 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </form>
      </div>

      {/* Feed */}
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-light-300 py-20 text-center dark:border-dark-300">
          <Megaphone className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {search ? "No announcements found" : "No announcements yet"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {search
              ? `Nothing matches “${search}”. Try a different search term.`
              : "Library news and updates will appear here once published."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {announcements.map((item) => (
              <Link
                key={item.id}
                href={`/announcements/${item.id}`}
                className="group flex flex-col rounded-2xl border border-light-300 bg-white p-6 transition-shadow hover:shadow-md dark:border-dark-300 dark:bg-gray-800"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.publishedAt
                    ? format(new Date(item.publishedAt), "MMMM d, yyyy")
                    : ""}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-500 dark:text-gray-400">
                  {item.content}
                </p>
                <span className="mt-4 text-sm font-medium text-amber-600 dark:text-amber-400">
                  Read announcement →
                </span>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" asChild={page > 1}>
                {page > 1 ? (
                  <Link href={buildPageHref(page - 1)}>
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
                  <Link href={buildPageHref(page + 1)}>
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
        </>
      )}
    </div>
  );
};

export default Page;
