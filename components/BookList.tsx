import React from "react";
import BookCard from "./BookCard";


interface Props {
  title: string;
  books: Book[]; 
  containerClassName?: string;
  // User data for PDF receipts (only needed for loaned books)
  userData?: {
    fullName: string;
    email: string;
    universityId?: number;
  };
}

const BookList = ({ title, books, containerClassName, userData }: Props) => {
  if (!books || books.length === 0) return null;
  return (
    <section className={containerClassName}>
      <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>

      <div className="book-list">
        {books.map((book) => (
          <BookCard 
            key={book.title} 
            {...book} 
            userName={userData?.fullName}
            userEmail={userData?.email}
            universityId={userData?.universityId}
          />
        ))}
      </div>
    </section>
  );
};
export default BookList;