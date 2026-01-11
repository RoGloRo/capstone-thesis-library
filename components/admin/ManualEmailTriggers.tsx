"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock, Mail, AlertTriangle, Loader2 } from "lucide-react";

type EmailType = "due-today" | "overdue" | "due-reminder";

interface EmailCounts {
  dueToday: number;
  overdue: number;
  dueTomorrow: number;
}

export function ManualEmailTriggers() {
  const [loading, setLoading] = useState<EmailType | null>(null);
  const [showModal, setShowModal] = useState<EmailType | null>(null);
  const [emailCounts, setEmailCounts] = useState<EmailCounts>({
    dueToday: 0,
    overdue: 0,
    dueTomorrow: 0,
  });

  const fetchEmailCounts = async () => {
    try {
      const response = await fetch("/api/test-helpers/automated-emails-diagnostic");
      const data = await response.json();
      
      setEmailCounts({
        dueToday: data.booksDueToday?.total || 0,
        overdue: data.overdueBooks?.needingEmail || 0,
        dueTomorrow: data.booksDueTomorrow?.needingReminder || 0,
      });
    } catch (error) {
      console.error("Failed to fetch email counts:", error);
      toast.error("Failed to load email counts");
    }
  };

  const handleButtonClick = async (type: EmailType) => {
    await fetchEmailCounts();
    setShowModal(type);
  };

  const handleConfirmSend = async (type: EmailType) => {
    setLoading(type);
    setShowModal(null);

    try {
      let endpoint = "";
      let emailType = "";

      switch (type) {
        case "due-today":
          endpoint = "/api/workflows/manual-due-today-reminders";
          emailType = "Due Today";
          break;
        case "overdue":
          endpoint = "/api/workflows/manual-overdue-notices";
          emailType = "Overdue";
          break;
        case "due-reminder":
          endpoint = "/api/workflows/manual-due-date-reminders";
          emailType = "Due Date Reminder";
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        // Prefer explicit fields returned by manual endpoints
        const total = result.totalRecipients || result.total || result.sent || result.emailsSent || 0;
        const triggerId = result.triggerId || result.id;
        toast.success(`${emailType} emails triggered successfully`, {
          description: `Queued ${total} email(s)${triggerId ? ` (trigger: ${triggerId})` : ""}`,
        });

        // Refresh the page after a short delay to show updated logs
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to send emails");
      }
    } catch (error) {
      console.error(`${type} email trigger failed:`, error);
      toast.error("Failed to trigger emails", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(null);
    }
  };

  const getModalContent = (type: EmailType) => {
    switch (type) {
      case "due-today":
        return {
          title: "Send Due Today Emails",
          description: `Send urgent reminders to users with books due today. This will notify ${emailCounts.dueToday} user(s) that their book(s) must be returned today.`,
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          count: emailCounts.dueToday,
        };
      case "overdue":
        return {
          title: "Send Overdue Penalty Emails",
          description: `Send penalty notifications to users with overdue books. This will notify ${emailCounts.overdue} user(s) about their overdue book(s) and associated penalties.`,
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          count: emailCounts.overdue,
        };
      case "due-reminder":
        return {
          title: "Send Due Date Reminder Emails",
          description: `Send friendly reminders to users with books due tomorrow. This will notify ${emailCounts.dueTomorrow} user(s) that their book(s) are due soon.`,
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          count: emailCounts.dueTomorrow,
        };
      default:
        return { title: "", description: "", icon: null, count: 0 };
    }
  };

  const modalContent = showModal ? getModalContent(showModal) : null;

  return (
    <>
      {/* Manual Trigger Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manual Email Triggers
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manually trigger email notifications for testing or immediate delivery
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleButtonClick("due-today")}
              disabled={!!loading}
              variant="outline"
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {loading === "due-today" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Send Due Today Emails
            </Button>

            <Button
              onClick={() => handleButtonClick("overdue")}
              disabled={!!loading}
              variant="outline"
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              {loading === "overdue" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Send Overdue Emails
            </Button>

            <Button
              onClick={() => handleButtonClick("due-reminder")}
              disabled={!!loading}
              variant="outline"
              className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
            >
              {loading === "due-reminder" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              Send Due Date Reminder Emails
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={!!showModal} onOpenChange={() => setShowModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalContent?.icon}
              {modalContent?.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              {modalContent?.description}
            </DialogDescription>
          </DialogHeader>

          {modalContent?.count === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  No emails need to be sent at this time. All users are up to date with their notifications.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => showModal && handleConfirmSend(showModal)}
              disabled={modalContent?.count === 0}
            >
              {modalContent?.count === 0 ? "No Emails to Send" : `Send ${modalContent?.count} Email(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}