// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  videoUrl: string;
  summary: string;
  createdAt: Date;
};

type User = {
  id: string;
  fullName: string;
  email: string;
  universityId: number;
  universityCard: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  role: 'USER' | 'ADMIN' | null;
  lastActivityDate: string | null;
  createdAt: Date | null;
};

type BorrowRecord = {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: 'BORROWED' | 'STATUS';
  createdAt: Date;
};

type SavedBook = {
  id: string;
  userId: string;
  bookId: string;
  savedAt: Date;
  createdAt: Date;
};
