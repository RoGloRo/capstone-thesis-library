import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";
import { render } from "@react-email/render";
import OverdueBookEmail from "@/emails/OverdueBookEmail";
import { sendOverdueNoticeEmail } from "@/lib/email-with-logging";
import { eq } from "drizzle-orm";

export async function processOverdueBatch(triggerId: string, records: Array<any>) {
  let sent = 0;
  let failed = 0;

  for (const r of records) {
    try {
      // check if already processed for this trigger
      const existing = await db
        .select({ metadata: emailLogs.metadata })
        .from(emailLogs)
        .where(eq(emailLogs.recipientEmail, r.userEmail));

      let alreadyProcessed = false;
      for (const row of existing) {
        if (!row.metadata) continue;
        try {
          const meta = JSON.parse(row.metadata as string);
          if (meta && meta.triggerId === triggerId) {
            alreadyProcessed = true;
            break;
          }
        } catch (e) {}
      }
      if (alreadyProcessed) continue;

      const today = new Date();
      const dueDate = new Date(r.dueDate);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue < 1) continue;

      const penaltyPerDay = 0.5;
      const penaltyAmount = daysOverdue * penaltyPerDay;

      const emailData = {
        userName: r.userFullName || "Library Member",
        bookTitle: r.bookTitle || "Unknown Book",
        bookAuthor: r.bookAuthor || "Unknown Author",
        borrowDate: new Date(r.borrowDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        dueDate: new Date(r.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        daysOverdue,
        penaltyAmount,
        returnBookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`}/my-profile`,
      };

      const emailHtml = await render(OverdueBookEmail(emailData));

      await sendOverdueNoticeEmail(
        r.userEmail,
        r.userFullName || "Library Member",
        emailHtml,
        r.bookTitle || "Unknown Book",
        daysOverdue,
        { triggerSource: "ADMIN", triggerId, borrowRecordId: r.borrowRecordId, penaltyAmount }
      );

      sent++;
    } catch (err) {
      failed++;
      console.error("Processor: failed to send overdue email for", r.userEmail, err);
    }
  }

  return { sent, failed };
}

export function isLoopbackHost(hostname: string) {
  if (!hostname) return true;
  const h = hostname.toLowerCase();
  if (h === "localhost") return true;
  if (h === "::1") return true;
  if (h === "0.0.0.0") return true;
  if (h === "127.0.0.1") return true;
  return false;
}
