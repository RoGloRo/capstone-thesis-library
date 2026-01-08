// app/admin/books/edit/[id]/page.tsx
import BookForm from "@/components/admin/forms/BookForm";
import { getBookById } from "@/lib/admin/actions/book";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditBookPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { id: bookId } = await params;
  const result = await getBookById(bookId);
  
  if (!result.success || !result.book) {
    notFound();
  }

  // Explicitly pass each property to avoid any potential issues with spreading
  const { 
    title,
    author,
    genre,
    rating,
    description,
    totalCopies,
    coverUrl,
    coverColor,
    videoUrl,
    summary
    ,controlNumber
  } = result.book;

  return (
    <>
      <Button asChild className="back-btn">
        <Link href="/admin/books">Go Back</Link>
      </Button>

      <section className="w-full max-w-2xl mt-6">
        <BookForm 
          type="update"
          id={bookId}
          title={title}
          author={author}
          genre={genre}
          rating={rating}
          description={description}
          totalCopies={totalCopies}
          coverUrl={coverUrl}
          coverColor={coverColor}
          videoUrl={videoUrl}
          summary={summary}
          controlNumber={controlNumber}
        />
      </section>
    </>
  );
}