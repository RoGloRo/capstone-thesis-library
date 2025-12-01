"use client";

import Link from "next/link";
import React, { useState } from "react";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

const daysBetween = (from: Date, to: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((to.getTime() - from.getTime()) / msPerDay);
};

const BookCard = ({ id, title, genre, coverColor, coverUrl, isLoanedBook = false, borrowDate, dueDate, returnDate }: Book) => {
  const [showDetails, setShowDetails] = useState(false);
  let dueText = "";
  if (returnDate) {
    dueText = `Returned on ${formatDate(returnDate)}`;
  } else if (dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = daysBetween(now, due);
    if (daysLeft > 0) dueText = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to return`;
    else if (daysLeft === 0) dueText = `Due today`;
    else dueText = `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue`;
  }

  return (
    <li className={cn(isLoanedBook && "xs:w-52 w-full")}> 
      <Link href={`/books/${id}`} className={cn(isLoanedBook && "w-full flex flex-col items-center")}>

        <BookCover coverColor={coverColor} coverImage={coverUrl} className={""} />

        <div className={cn("mt-4", !isLoanedBook && "xs:max-w-40 max-w-28")}>
          <p className="book-title">{title}</p>
          <p className="book-genre">{genre}</p>
        </div>

        {isLoanedBook && (
          <div className="mt-3 w-full">
            <div className="book-loaned">
              <Image src="/icons/calendar.svg" alt="calendar" width={18} height={18} className="object-contain" />
              <p className="text-light-100">{dueText}</p>
            </div>
            <div className="mt-2 flex gap-2 items-center">
              <Button className="book-btn text-black">Download receipt</Button>
              <Button variant="ghost" className="book-btn" onClick={(e) => { e.preventDefault(); setShowDetails((s) => !s); }}>
                {showDetails ? "Hide loan details" : "View loan details"}
              </Button>
            </div>

            {showDetails && (
              <div className="mt-3 rounded-md border border-muted p-3 bg-muted/5">
                <p className="text-sm text-muted-foreground">
                  <strong>Borrowed at:</strong> {borrowDate ? formatDate(borrowDate) : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Due date:</strong> {dueDate ? formatDate(dueDate) : "—"}
                </p>
                {returnDate && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Returned:</strong> {formatDate(returnDate)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </Link>
    </li>
  );
};

export default BookCard;