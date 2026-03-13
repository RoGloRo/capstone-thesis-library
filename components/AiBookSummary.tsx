"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  author: string;
  description: string;
}

export default function AiBookSummary({ title, author, description }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache summary per unique book (title + author key)
  const cacheRef = useRef<Record<string, string>>({});

  const handleGenerate = async () => {
    const cacheKey = `${title}__${author}`;

    // Return cached result without hitting the API again
    if (cacheRef.current[cacheKey]) {
      setSummary(cacheRef.current[cacheKey]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/book-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, description }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to generate summary. Please try again.");
        return;
      }

      cacheRef.current[cacheKey] = data.summary;
      setSummary(data.summary);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h3>AI Summary</h3>

      {summary && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xl text-light-100 leading-relaxed">{summary}</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="flex w-fit items-center gap-2 rounded-lg bg-dark-300 px-5 py-2.5 text-sm font-medium text-light-100 hover:bg-dark-400 border border-green-500/30 hover:border-green-500/60 transition-colors disabled:opacity-60 max-md:w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-green-500" />
            <span>Generating summary...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-green-500" />
            <span>Generate AI Summary</span>
          </>
        )}
      </Button>
    </section>
  );
}
