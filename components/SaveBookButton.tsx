"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { toggleSaveBook } from "@/lib/actions/book";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  bookId: string;
  initialIsSaved: boolean;
  className?: string;
}

export default function SaveBookButton({ userId, bookId, initialIsSaved, className }: Props) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const prev = isSaved;
    setIsSaved(!prev); // optimistic update

    try {
      const result = await toggleSaveBook({ userId, bookId });
      if (!result.success) {
        setIsSaved(prev);
        toast.error("Failed to update saved status");
      } else {
        toast.success(result.saved ? "Book saved to your list!" : "Book removed from saved");
      }
    } catch {
      setIsSaved(prev);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isSaved ? "Remove from saved" : "Save book"}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      <Bookmark
        className={cn(
          "h-5 w-5 transition-all duration-200",
          isSaved
            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]"
            : "text-light-200 hover:text-amber-300"
        )}
      />
    </button>
  );
}
