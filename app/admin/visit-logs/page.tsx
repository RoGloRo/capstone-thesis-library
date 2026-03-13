import { Scan } from "lucide-react";
import VisitLogsClient from "@/components/admin/VisitLogsClient";
import { getVisitLogs, getVisitStats } from "@/lib/actions/visit-logs";

export default async function VisitLogsPage() {
  const [logs, stats] = await Promise.all([
    getVisitLogs("today"),
    getVisitStats(),
  ]);

  const initialLogs = logs.map((r) => ({
    id: r.id,
    visitDate: r.visitDate,
    visitTime: r.visitTime,
    fullName: r.fullName ?? null,
    universityId: r.universityId ?? null,
    email: r.email ?? null,
  }));

  const statsData = {
    todayCount: Number(stats.todayCount),
    weekCount: Number(stats.weekCount),
    topVisitors: stats.topVisitors.map((v) => ({
      userId: v.userId,
      fullName: v.fullName ?? null,
      universityId: v.universityId ?? null,
      visitCount: Number(v.visitCount),
    })),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <Scan className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Scan student QR codes to log library visits and monitor attendance.
          </p>
        </div>
      </div>

      <VisitLogsClient initialLogs={initialLogs} stats={statsData} />
    </div>
  );
}
