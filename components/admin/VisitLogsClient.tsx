"use client";

import { useState, useCallback, useTransition } from "react";
import { Camera, Calendar, Users, TrendingUp, Filter, RefreshCw } from "lucide-react";
import QRScanner from "@/components/admin/QRScanner";
import { getVisitLogs } from "@/lib/actions/visit-logs";

type FilterType = "today" | "week" | "month" | "all";

interface VisitRow {
  id: string;
  visitDate: string | null;
  visitTime: string;
  fullName: string | null;
  universityId: number | null;
  email: string | null;
}

interface StatsData {
  todayCount: number;
  weekCount: number;
  topVisitors: { userId: string; fullName: string | null; universityId: number | null; visitCount: number }[];
}

interface VisitLogsClientProps {
  initialLogs: VisitRow[];
  stats: StatsData;
}

export default function VisitLogsClient({ initialLogs, stats }: VisitLogsClientProps) {
  const [logs, setLogs] = useState<VisitRow[]>(initialLogs);
  const [filter, setFilter] = useState<FilterType>("today");
  const [isPending, startTransition] = useTransition();

  const loadLogs = useCallback((f: FilterType) => {
    setFilter(f);
    startTransition(async () => {
      const rows = await getVisitLogs(f);
      setLogs(
        rows.map((r) => ({
          id: r.id,
          visitDate: r.visitDate,
          visitTime: r.visitTime,
          fullName: r.fullName ?? null,
          universityId: r.universityId ?? null,
          email: r.email ?? null,
        }))
      );
    });
  }, []);

  const refreshLogs = useCallback(() => {
    loadLogs(filter);
  }, [filter, loadLogs]);

  const filterLabels: { key: FilterType; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Visits Today</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.weekCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Visits This Week</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topVisitors[0]?.fullName ?? "—"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Most Frequent Visitor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — QR Scanner */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Camera className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code Scanner</h2>
            </div>
            <QRScanner onVisitRecorded={refreshLogs} />
          </div>
        </div>

        {/* Right — Visit Logs Table */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visit History</h2>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-wrap">
                {filterLabels.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => loadLogs(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === key
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={refreshLogs}
                  className="p-1.5 text-gray-400 hover:text-emerald-500 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {isPending ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No visits recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    logs.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          idx === 0 ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {(row.fullName ?? "?").charAt(0).toUpperCase()}
                            </div>
                            {row.fullName ?? "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                          {row.universityId ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                          {row.visitDate
                            ? new Date(row.visitDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">
                          {row.visitTime}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-right">
              {logs.length} record{logs.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Most Frequent Visitors */}
          {stats.topVisitors.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Most Frequent Visitors (This Month)
              </h2>
              <div className="space-y-3">
                {stats.topVisitors.map((v, i) => (
                  <div key={v.userId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                      {(v.fullName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{v.fullName ?? "Unknown"}</p>
                      <p className="text-xs text-gray-400">ID: {v.universityId ?? "—"}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {v.visitCount} visit{Number(v.visitCount) !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
