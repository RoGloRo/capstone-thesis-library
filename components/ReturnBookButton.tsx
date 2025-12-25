"use client";

import { useState } from "react";
import { returnBook } from "@/lib/actions/book";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface ReturnBookButtonProps {
  borrowRecordId?: string;
  bookId: string;
  userId: string;
  onSuccess?: () => void;
}

export function ReturnBookButton({ 
  borrowRecordId, 
  bookId,
  userId,
  onSuccess 
}: ReturnBookButtonProps) {
  const [isReturning, setIsReturning] = useState(false);

  const handleReturn = async () => {
    setIsReturning(true);
    try {
      // If we don't have borrowRecordId, try to find it
      let recordId = borrowRecordId;
      if (!recordId) {
        const response = await fetch(`/api/books/${bookId}/borrow-status?userId=${userId}`);
        const data = await response.json();
        if (data.borrowRecordId) {
          recordId = data.borrowRecordId;
        } else {
          throw new Error("No active borrow record found");
        }
      }
      
      if (!recordId) {
        throw new Error("Failed to get borrow record ID");
      }
      
      const result = await returnBook({ 
        borrowRecordId: recordId, 
        bookId 
      });
      
      if (result.success) {
        toast.success("Book returned successfully");
        // Refresh the page to update the UI
        window.location.reload();
        // Call the onSuccess callback if provided
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to return book");
      }
    } catch (error) {
      console.error("Error returning book:", error);
      toast.error("An error occurred while returning the book");
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <Button
      className="book-overview_btn bg-red-600 hover:bg-red-700"
      onClick={handleReturn}
      disabled={isReturning}
    >
      <Image 
        src="/icons/book.svg" 
        alt="return" 
        width={20} 
        height={20} 
        className="invert"
      />
      <p className="font-bebas-neue text-xl text-dark-100">
        {isReturning ? "Returning..." : "Return Book"}
      </p>
    </Button>
  );
}