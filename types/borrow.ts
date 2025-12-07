// types/borrow.ts
export interface BorrowRecord {
  id: string;
  userName: string | null;
  userEmail: string | null;
  universityId: number | null;
  universityCard: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  borrowDate: Date;
  dueDate: string;
  returnDate: string | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
}

export interface BorrowRecordsResponse {
  success: boolean;
  data?: BorrowRecord[];
  message?: string;
  error?: string;
}