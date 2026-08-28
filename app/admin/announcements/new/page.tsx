// app/admin/announcements/new/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AnnouncementForm from "@/components/admin/announcements/AnnouncementForm";

const Page = () => {
  return (
    <>
      <Button asChild className="back-btn">
        <Link href="/admin/announcements">Go Back</Link>
      </Button>

      <section className="w-full max-w-2xl mt-6">
        <AnnouncementForm />
      </section>
    </>
  );
};
export default Page;