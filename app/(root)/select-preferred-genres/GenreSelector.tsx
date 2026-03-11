"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePreferredGenres } from "@/lib/actions/auth";
import { BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const GENRE_COLORS: Record<string, string> = {
  Fiction: "from-purple-600 to-purple-800",
  "Non-Fiction": "from-blue-600 to-blue-800",
  Science: "from-cyan-600 to-cyan-800",
  Technology: "from-teal-600 to-teal-800",
  History: "from-amber-600 to-amber-800",
  Biography: "from-orange-600 to-orange-800",
  Fantasy: "from-violet-600 to-violet-800",
  Mystery: "from-slate-600 to-slate-800",
  Romance: "from-rose-600 to-rose-800",
  Horror: "from-red-700 to-red-900",
  "Self-Help": "from-lime-600 to-lime-800",
  Philosophy: "from-indigo-600 to-indigo-800",
  Psychology: "from-pink-600 to-pink-800",
  Business: "from-emerald-600 to-emerald-800",
  Economics: "from-green-600 to-green-800",
  Art: "from-fuchsia-600 to-fuchsia-800",
  Poetry: "from-sky-600 to-sky-800",
  Drama: "from-yellow-600 to-yellow-800",
  "Science Fiction": "from-cyan-700 to-blue-800",
  Adventure: "from-green-600 to-teal-800",
  Thriller: "from-gray-700 to-gray-900",
  "Children's": "from-yellow-500 to-orange-600",
};

const defaultColor = "from-emerald-600 to-green-800";

interface Props {
  genres: string[];
  userId: string;
}

export default function GenreSelector({ genres, userId }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggle = (genre: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) {
        next.delete(genre);
      } else {
        next.add(genre);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selected.size === 0) {
      toast.error("Please select at least one genre to continue");
      return;
    }
    setLoading(true);
    try {
      const result = await savePreferredGenres({
        userId,
        genres: Array.from(selected),
      });
      if (result.success) {
        toast.success("Preferences saved! Welcome to the library.");
        // Hard navigation so the browser sends the freshly-set server cookie
        // to the middleware on the very next request.
        window.location.href = "/";
      } else {
        toast.error(result.error ?? "Failed to save preferences");
        setLoading(false);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          What do you love to read?
        </h1>
        <p className="text-light-200 text-base sm:text-lg max-w-xl mx-auto">
          Select your favourite genres so we can personalise your reading
          recommendations. Pick as many as you like!
        </p>
        {selected.size > 0 && (
          <p className="mt-2 text-sm text-emerald-400 font-medium">
            {selected.size} genre{selected.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Genre Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {genres.map((genre) => {
          const isSelected = selected.has(genre);
          const gradient = GENRE_COLORS[genre] ?? defaultColor;
          return (
            <button
              key={genre}
              onClick={() => toggle(genre)}
              className={cn(
                "relative group rounded-xl px-3 py-4 text-sm font-semibold transition-all duration-200 select-none",
                "border-2 flex items-center justify-between gap-2",
                isSelected
                  ? `bg-gradient-to-br ${gradient} border-white/40 text-white shadow-lg scale-[1.02]`
                  : "bg-dark-300/50 border-white/10 text-light-200 hover:border-emerald-500/50 hover:text-white hover:bg-dark-300/80"
              )}
            >
              <span className="truncate">{genre}</span>
              {isSelected && (
                <span className="shrink-0 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-light-400 text-center sm:text-left">
          You can always update your preferences later from your profile.
        </p>
        <button
          onClick={handleContinue}
          disabled={loading || selected.size === 0}
          className={cn(
            "w-full sm:w-auto min-w-40 rounded-xl px-8 py-3 font-bebas-neue text-xl tracking-wide transition-all duration-200",
            "bg-primary text-dark-100 hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? "Saving..." : "Continue →"}
        </button>
      </div>
    </div>
  );
}
