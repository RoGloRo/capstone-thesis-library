interface Book {
  id: string;
  title: string; 
  author: string; 
  genre: string;
  rating: number;
  totalCopies: number; 
  availableCopies: number; 
  description: string;
  coverColor: string; 
  coverUrl: string;
  videoUrl: string;
  summary: string;
  controlNumber?: string | null;
  publishedYear?: number | null;
  identifier?: string | null;
  publisher?: string | null;
  edition?: string | null;
  language?: string | null;
  pages?: number | null;
  shelfLocation?: string | null;
  bookFormat?: string | null;
  acquisitionDate?: string | null;
  isLoanedBook?: boolean;
  borrowDate?: string; // ISO timestamp
  dueDate?: string; // ISO date
  returnDate?: string | null; // ISO date or null
}

interface AuthCredentials {
  fullName: string;
  email: string;
  password: string;
  universityId: string;
  universityCard: string;
}

interface BookParams {
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  videoUrl: string;
  summary: string;
  controlNumber?: string | null;
  publishedYear?: number | null;
  identifier?: string | null;
  publisher?: string | null;
  edition?: string | null;
  language?: string | null;
  pages?: number | null;
  shelfLocation?: string | null;
  bookFormat?: string | null;
  acquisitionDate?: string | null;
}

interface BorrowBookParams {
  bookId: string;
  userId: string;
  borrowDays?: number; // 1–30 days; defaults to 7 if not provided
}