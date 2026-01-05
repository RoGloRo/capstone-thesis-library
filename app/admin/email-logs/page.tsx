import { EmailLogsTable } from "@/components/admin/EmailLogsTable";
import { EmailLogsSummary } from "@/components/admin/EmailLogsSummary";
import { ManualEmailTriggers } from "@/components/admin/ManualEmailTriggers";
import { getEmailLogs, getEmailLogsSummary } from "./utils";

export default async function EmailLogsPage() {
  const [emailLogs, summaryStats] = await Promise.all([
    getEmailLogs(),
    getEmailLogsSummary()
  ]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Email Activity Logs</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor all system email notifications and their delivery status</p>
      </div>
      
      {/* Summary Cards */}
      <EmailLogsSummary stats={summaryStats} />

      {/* Manual Email Trigger Controls */}
      <ManualEmailTriggers />

      {/* Email Logs Table */}
      <EmailLogsTable data={emailLogs} />
    </div>
  );
}