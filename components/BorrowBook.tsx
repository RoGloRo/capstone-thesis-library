"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { borrowBook } from "@/lib/actions/book";

interface Props {
  userId: string;
  bookId: string;
  borrowingEligibility: {
    isEligible: boolean;
    message: string;
  };
}

const MAX_DAYS = 30;

const BorrowBook = ({
  userId,
  bookId,
  borrowingEligibility: { isEligible, message },
}: Props) => {
  const router = useRouter();
  const [borrowing, setBorrowing] = useState(false);
  const [borrowDays, setBorrowDays] = useState(7);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + borrowDays);
  const dueDateLabel = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleBorrowBook = async () => {
    if (!isEligible) {
      toast("Error", { description: message });
      return;
    }

    setBorrowing(true);

    try {
      const result = await borrowBook({ bookId, userId, borrowDays });

      if (result.success) {
        toast("Success", { description: "Borrowing successful. Please check your email for the loan details." });
        router.push("/my-profile");
      } else {
        toast("Already Borrowed", {
          description: "You already have an active borrowing for this book",
        });
      }
    } catch {
      toast("Error", {
        description: "An error occurred while borrowing the book",
      });
    } finally {
      setBorrowing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Borrow Duration Selector */}
      <div className="rounded-xl bg-dark-300/60 border border-dark-600 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-light-200">Borrow Duration</span>
          <span className="text-sm font-bold text-green-500">
            {borrowDays} {borrowDays === 1 ? "day" : "days"}
          </span>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min={1}
            max={MAX_DAYS}
            value={borrowDays}
            onChange={(e) => setBorrowDays(Number(e.target.value))}
            disabled={!isEligible || borrowing}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500 bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-light-500 mt-1 select-none">
            <span>1 day</span>
            <span>30 days</span>
          </div>
        </div>

        {/* Due Date Preview */}
        <div className="flex items-center gap-2 rounded-lg bg-dark-400/50 px-3 py-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-green-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-light-200">
            Due date:{" "}
            <span className="font-semibold text-green-400">{dueDateLabel}</span>
          </p>
        </div>
      </div>

      {/* Borrow Button */}
      <Button
        className="book-overview_btn"
        onClick={handleBorrowBook}
        disabled={borrowing}
      >
        <Image src="/icons/book.svg" alt="book" width={20} height={20} />
        <p className="font-bebas-neue text-xl text-dark-100">
          {borrowing ? "Borrowing ..." : "Borrow Book"}
        </p>
      </Button>
    </div>
  );
};
export default BorrowBook;

