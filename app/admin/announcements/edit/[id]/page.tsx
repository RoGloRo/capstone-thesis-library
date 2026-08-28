// app/admin/announcements/edit/[id]/page.tsx
import AnnouncementForm from "@/components/admin/announcements/AnnouncementForm";
import { getAnnouncementById } from "@/lib/admin/actions/announcements";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditAnnouncementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAnnouncementPage({
  params,
}: EditAnnouncementPageProps) {
  const { id } = await params;

  // getAnnouncementById is admin-guarded server-side, so a non-admin hitting
  // this URL directly gets a 404 (fail closed) rather than the content.
  const result = await getAnnouncementById(id);

  if (!result.success || !result.announcement) {
    notFound();
  }

  const { title, content, status, publishedAt } = result.announcement;

  return (
    <>
      <Button asChild className="back-btn">
        <Link href="/admin/announcements">Go Back</Link>
      </Button>

      <section className="w-full max-w-2xl mt-6">
        <AnnouncementForm
          type="update"
          id={id}
          title={title}
          content={content}
          status={status}
          publishedAt={publishedAt}
        />
      </section>
    </>
  );
}