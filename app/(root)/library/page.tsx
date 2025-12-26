import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { and, ilike, or, sql } from "drizzle-orm";
import BookCard from "@/components/BookCard";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

interface SearchParams {
  searchParams: Promise<{
    author?: string;
    genre?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: SearchParams) {
  // Get search parameters
  const params = await searchParams;
  const author = params?.author && params.author !== 'all' ? params.author : undefined;
  const genre = params?.genre && params.genre !== 'all' ? params.genre : undefined;
  const search = params?.search;
  const sort = params?.sort || 'title';
  
  // Get all unique authors and genres for filter dropdowns
  const [authorsResult, genresResult] = await Promise.all([
    db.select({ author: books.author }).from(books).groupBy(books.author).orderBy(books.author),
    db.select({ genre: books.genre }).from(books).groupBy(books.genre).orderBy(books.genre)
  ]);
  
  const availableAuthors = authorsResult.map(r => r.author).filter(Boolean);
  const availableGenres = genresResult.map(r => r.genre).filter(Boolean);
  
  // Build the conditions array
  const conditions = [];
  
  if (search) {
    const searchTerm = `%${decodeURIComponent(search)}%`;
    conditions.push(
      or(
        ilike(books.title, searchTerm),
        ilike(books.author, searchTerm),
        ilike(books.genre, searchTerm)
      )
    );
  }
  
  if (author) {
    const authorSearch = `%${decodeURIComponent(author)}%`;
    conditions.push(ilike(books.author, authorSearch));
  }
  
  if (genre) {
    const genreSearch = `%${decodeURIComponent(genre)}%`;
    conditions.push(ilike(books.genre, genreSearch));
  }
  
  // Build and execute the query in a single chain to avoid type issues
  const filteredBooks = await (() => {
    let baseQuery = db.select().from(books);
    
    // Apply conditions if any
    if (conditions.length > 0) {
      // @ts-expect-error: Drizzle type system issue with query reassignment
      baseQuery = baseQuery.where(and(...conditions));
    }
    
    // Apply sorting
    switch (sort) {
      case 'author':
        return baseQuery.orderBy(books.author);
      case 'rating':
        return baseQuery.orderBy(sql`${books.rating} DESC`);
      case 'genre':
        return baseQuery.orderBy(books.genre);
      default:
        return baseQuery.orderBy(books.title);
    }
  })();
  


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            Library
          </h1>
          <p className="text-blue-200">Discover and explore our book collection</p>
        </div>
        
        {/* Search Bar */}
        <SearchBar 
          currentSearch={search}
          currentAuthor={author}
          currentGenre={genre}
          currentSort={sort}
          availableAuthors={availableAuthors}
          availableGenres={availableGenres}
        />
        
        {/* Active Filters */}
        {(search || author || genre) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-blue-200">Active filters:</span>
            {search && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                Search: &ldquo;{decodeURIComponent(search)}&rdquo;
              </Badge>
            )}
            {author && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                Author: {decodeURIComponent(author)}
              </Badge>
            )}
            {genre && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                Genre: {decodeURIComponent(genre)}
              </Badge>
            )}
            <Link href="/library">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-red-600 border-red-500 text-white hover:bg-red-700 hover:border-red-600"
              >
                Clear all filters
              </Button>
            </Link>
          </div>
        )}
        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-blue-200">
            {filteredBooks.length === 0 
              ? 'No books found'
              : `${filteredBooks.length} book${filteredBooks.length === 1 ? '' : 's'} found`
            }
            {sort && sort !== 'title' && (
              <span className="ml-2 text-sm">
                • Sorted by {sort === 'rating' ? 'rating (highest first)' : sort}
              </span>
            )}
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/10">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Books Found</h3>
            <p className="text-gray-400 mb-4">
              {search || author || genre 
                ? 'Try adjusting your search criteria or filters'
                : 'No books are currently available in the library'
              }
            </p>
            {(search || author || genre) && (
              <Link href="/library">
                <Button 
                  variant="outline" 
                  className="bg-red-600 border-red-500 text-white hover:bg-red-700 hover:border-red-600"
                >
                  Clear all filters
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 p-3 sm:p-6 rounded-2xl border border-white/10">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
