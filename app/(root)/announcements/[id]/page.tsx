// app/(root)/announcements/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Megaphone } from "lucide-react";
import { format } from "date-fns";

import { getPublishedAnnouncement } from "@/lib/actions/announcements";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  // PUBLISHED-only, enforced inside the action: drafts and archived
  // announcements 404 here even with a valid id.
  const result = await getPublishedAnnouncement(id);
  if (!result.success || !result.announcement) {
    notFound();
  }

  const { title, content, publishedAt } = result.announcement;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/announcements"
        className="mb-6 flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" /> Back to announcements
      </Link>

      <article className="rounded-2xl border border-light-300 bg-white p-8 dark:border-dark-300 dark:bg-gray-800">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <Megaphone className="h-5 w-5" />
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {publishedAt
              ? `Published on ${format(new Date(publishedAt), "MMMM d, yyyy 'at' h:mm a")}`
              : ""}
          </p>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>

        <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {content}
        </div>
      </article>
    </div>
  );
};

export default Page;
