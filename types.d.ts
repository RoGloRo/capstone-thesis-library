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
  isLoanedBook?: boolean;
  borrowDate?: string; // ISO timestamp
  dueDate?: string; // ISO date
  returnDate?: string | null; // ISO date or null
}

interface AuthCredentials {
  fullName: string;
  email: string;
  password: string;
  universityId: number;
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
}

interface BorrowBookParams {
  bookId: string;
  userId: string;
}