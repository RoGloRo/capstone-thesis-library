import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { and, ilike, or } from "drizzle-orm";
import BookCard from "@/components/BookCard";
import { Book } from "@/types";

interface SearchParams {
  searchParams: {
    author?: string;
    genre?: string;
    search?: string;
  };
}

export default async function LibraryPage({ searchParams }: SearchParams) {
  // Get search parameters
  const { author, genre, search } = searchParams;
  
  // Build the query based on search parameters
  let query = db.select().from(books);
  
  if (search) {
    const searchTerm = `%${decodeURIComponent(search)}%`;
    query = query.where(
      or(
        ilike(books.title, searchTerm),
        ilike(books.author, searchTerm),
        ilike(books.genre, searchTerm)
      )
    );
  } else {
    if (author) {
      const authorSearch = `%${decodeURIComponent(author)}%`;
      query = query.where(ilike(books.author, authorSearch));
    }
    
    if (genre) {
      const genreSearch = `%${decodeURIComponent(genre)}%`;
      query = query.where(ilike(books.genre, genreSearch));
    }
  }
  
  // Execute the query with ordering
  const filteredBooks = (await query.orderBy(books.title)) as unknown as Book[];
  
  // Function to get filter message
  const getFilterMessage = () => {
    if (search) {
      return `Search results for "${decodeURIComponent(search)}"`;
    }
    if (author && genre) {
      return `Showing books by ${decodeURIComponent(author)} in ${decodeURIComponent(genre)}`;
    }
    if (author) {
      return `Showing books by ${decodeURIComponent(author)}`;
    }
    if (genre) {
      return `Showing books in ${decodeURIComponent(genre)}`;
    }
    return 'All Books';
  };

  return (
    <section className="mt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Library</h1>
          {(search || author || genre) && (
            <p className="text-muted-foreground mt-1">
              {getFilterMessage()}
              <a 
                href="/library" 
                className="ml-2 text-blue-400 hover:underline"
              >
                (Clear filters)
              </a>
            </p>
          )}
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {author || genre 
              ? `No books found matching your criteria.`
              : 'No books found in the library.'
            }
          </p>
          {(author || genre) && (
            <a 
              href="/library" 
              className="mt-2 inline-block text-blue-400 hover:underline"
            >
              Clear filters and view all books
            </a>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </ul>
      )}
    </section>
  );
}
