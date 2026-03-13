"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Meta {
  totalBooks: number;
  totalUsers: number;
  totalBorrows: number;
  recentBorrows: number;
  overdueCount: number;
  inactiveUsers: number;
}

export default function AiLibraryInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/library-insights");
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to generate insights. Please try again.");
        return;
      }

      setInsights(data.insights ?? []);
      setMeta(data.meta ?? null);
      setGenerated(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-green-500/30 bg-white dark:bg-dark-300/40">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          <CardTitle className="text-xl text-gray-900 dark:text-light-100">AI Library Insights</CardTitle>
        </div>
        <Button
          onClick={fetchInsights}
          disabled={loading}
          size="sm"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : generated ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Insights
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Insights
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        {/* Prompt state */}
        {!generated && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Click <span className="text-green-400 font-medium">Generate Insights</span> to let AI analyze your library data and surface actionable observations.
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-dark-400/60"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        )}

        {/* Insights list */}
        {!loading && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-dark-400/50 px-4 py-3 text-sm text-gray-800 dark:text-light-100"
              >
                <span className="text-base leading-snug">{insight}</span>
              </div>
            ))}

            {/* Quick-stats bar */}
            {meta && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 border-t border-gray-200 dark:border-white/10 pt-4">
                {[
                  { label: "Borrows (30d)", value: meta.recentBorrows },
                  { label: "Overdue", value: meta.overdueCount },
                  { label: "Inactive Users", value: meta.inactiveUsers },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-gray-100 dark:bg-dark-400/40 px-3 py-2 text-center"
                  >
                    <p className="text-lg font-bold text-green-400">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
