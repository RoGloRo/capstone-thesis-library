import React from "react";
import BookCard from "./BookCard";


interface Props {
  title: string;
  books: Book[]; 
  containerClassName?: string;
  /** Override the inner list div's class (e.g. for horizontal scroll). Defaults to "book-list". */
  listClassName?: string;
  // User data for PDF receipts (only needed for loaned books)
  userData?: {
    fullName: string;
    email: string;
    universityId?: number;
  };
  // Save feature
  userId?: string;
  savedBookIds?: string[];
}

const BookList = ({ title, books, containerClassName, listClassName, userData, userId, savedBookIds }: Props) => {
  if (!books || books.length === 0) return null;
  const savedSet = new Set(savedBookIds ?? []);
  return (
    <section className={containerClassName}>
      <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>

      <div className={listClassName ?? "book-list"}>
        {books.map((book) => (
          <BookCard 
            key={book.title} 
            {...book} 
            userName={userData?.fullName}
            userEmail={userData?.email}
            universityId={userData?.universityId}
            userId={userId}
            isSaved={savedSet.has(book.id)}
          />
        ))}
      </div>
    </section>
  );
};
export default BookList;