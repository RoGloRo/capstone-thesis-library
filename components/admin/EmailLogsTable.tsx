"use client";

import { useState } from "react";
import { EmailLog } from "@/app/admin/email-logs/utils";
import { getEmailTypeDisplayName, getEmailStatusEmoji } from "@/lib/email-logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface EmailLogsTableProps {
  data: EmailLog[];
}

export function EmailLogsTable({ data }: EmailLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Filter data based on search and filters
  const filteredData = data.filter((log) => {
    const matchesSearch = 
      log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.recipientName && log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    const matchesType = typeFilter === "ALL" || log.emailType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique email types and statuses for filters
  const uniqueTypes = Array.from(new Set(data.map(log => log.emailType)));
  const uniqueStatuses = Array.from(new Set(data.map(log => log.status)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-100 text-green-800 border-green-300";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Email Activity Logs</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Real-time monitoring of all system email notifications
        </CardDescription>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email, name, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {getEmailStatusEmoji(status as any)} {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getEmailTypeDisplayName(type as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {data.length === 0 ? "No email logs found" : "No logs match your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Recipient</th>
                  <th className="text-left p-3 font-medium">Subject</th>
                  <th className="text-left p-3 font-medium">Sent</th>
                  <th className="text-left p-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Badge className={getStatusColor(log.status)}>
                        {getEmailStatusEmoji(log.status as any)} {log.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium">
                        {getEmailTypeDisplayName(log.emailType as any)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{log.recipientEmail}</div>
                        {log.recipientName && (
                          <div className="text-sm text-gray-500">{log.recipientName}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm" title={log.subject}>
                        {log.subject.length > 50 
                          ? `${log.subject.substring(0, 50)}...` 
                          : log.subject}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-600">
                        {log.sentAt ? (
                          <div>
                            <div>{format(new Date(log.sentAt), "MMM d, yyyy")}</div>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {log.errorMessage ? (
                        <span 
                          className="text-red-600 text-sm cursor-help" 
                          title={log.errorMessage}
                        >
                          {log.errorMessage.length > 30 
                            ? `${log.errorMessage.substring(0, 30)}...` 
                            : log.errorMessage}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Show total count */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredData.length} of {data.length} email logs
        </div>
      </CardContent>
    </Card>
  );
}