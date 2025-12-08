"use client";

import Link from "next/link";
import React, { useState } from "react";
import BookCover from "./BookCover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { Download, Eye, EyeOff, Calendar, Clock, CheckCircle } from "lucide-react";

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

const BookCard = ({ 
  id, 
  title, 
  genre, 
  coverColor, 
  coverUrl, 
  isLoanedBook = false, 
  borrowDate, 
  dueDate, 
  returnDate, 
  availableCopies, 
  totalCopies 
}: Book) => {
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
          <p className="text-sm text-muted-foreground mt-1">
            {availableCopies} of {totalCopies} available
          </p>
        </div>

        {isLoanedBook && (
          <div className="mt-3 w-full">
            <div className="book-loaned">
              <Image src="/icons/calendar.svg" alt="calendar" width={18} height={18} className="object-contain" />
              <p className="text-light-100">{dueText}</p>
            </div>
            <div className="mt-3 flex flex-col gap-3 w-full">
              {/* Download Receipt Button */}
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl py-2.5 font-medium"
                onClick={(e) => { e.preventDefault(); }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              
              {/* View Loan Details Button */}
              <Button 
                variant="outline" 
                className="w-full border-2 border-blue-200 hover:border-blue-300 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 hover:text-blue-800 rounded-xl py-2.5 font-medium transition-all duration-300 backdrop-blur-sm"
                onClick={(e) => { e.preventDefault(); setShowDetails((s) => !s); }}
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Loan Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    View Loan Details
                  </>
                )}
              </Button>
            </div>

            {showDetails && (
              <div className="mt-4 rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 backdrop-blur-sm shadow-lg p-4 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Borrowed:</span>
                    <span className="text-blue-700">{borrowDate ? formatDate(borrowDate) : "—"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-blue-900">Due Date:</span>
                    <span className="text-blue-700">{dueDate ? formatDate(dueDate) : "—"}</span>
                  </div>
                  
                  {returnDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-blue-900">Returned:</span>
                      <span className="text-green-700">{formatDate(returnDate)}</span>
                    </div>
                  )}
                  
                  {/* Status Indicator */}
                  <div className="mt-3 pt-3 border-t border-blue-200/50">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                      returnDate 
                        ? "bg-green-100 text-green-800 border border-green-200" 
                        : dueDate && new Date(dueDate) < new Date()
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    )}>
                      {returnDate ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Returned
                        </>
                      ) : dueDate && new Date(dueDate) < new Date() ? (
                        <>
                          <Clock className="h-3 w-3" />
                          Overdue
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Active Loan
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </Link>
    </li>
  );
};

export default BookCard;