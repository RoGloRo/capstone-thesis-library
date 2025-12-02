// app/admin/books/edit/[id]/page.tsx
import BookForm from "@/components/admin/forms/BookForm";
import { getBookById } from "@/lib/admin/actions/book";
import { notFound } from "next/navigation";

interface EditBookPageProps {
  params: {
    id: string;
  };
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const bookId = params.id;
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
  } = result.book;

  return (
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
    />
  );
}