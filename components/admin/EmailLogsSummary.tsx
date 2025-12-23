"use client";

import { EmailLogsSummary as EmailLogsSummaryType } from "@/app/admin/email-logs/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle, Activity, TrendingUp } from "lucide-react";

interface EmailLogsSummaryProps {
  stats: EmailLogsSummaryType;
}

export function EmailLogsSummary({ stats }: EmailLogsSummaryProps) {
  const summaryCards = [
    {
      title: "Total Emails",
      value: stats.totalEmails.toLocaleString(),
      icon: <Mail className="h-4 w-4" />,
      className: "border-blue-500",
    },
    {
      title: "Sent Today",
      value: stats.emailsSentToday.toLocaleString(),
      icon: <Activity className="h-4 w-4" />,
      className: "border-yellow-500",
    },
    {
      title: "Successful",
      value: stats.successfulEmails.toLocaleString(),
      icon: <CheckCircle className="h-4 w-4" />,
      className: "border-green-500",
    },
    {
      title: "Failed",
      value: stats.failedEmails.toLocaleString(),
      icon: <XCircle className="h-4 w-4" />,
      className: "border-red-500",
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      className: "border-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className={`${card.className} border-l-4`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}