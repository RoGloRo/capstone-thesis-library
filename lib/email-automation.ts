import { db } from "@/database/drizzle";
import { borrowRecords, books, users, emailLogs } from "@/database/schema";
import { and, eq, lt, isNull, sql } from "drizzle-orm";
import { render } from "@react-email/render";
import OverdueBookEmail from "@/emails/OverdueBookEmail";
import DueDateReminderEmail from "@/emails/DueDateReminderEmail";
import BookDueTodayEmail from "@/emails/BookDueTodayEmail";
import {
  sendDueReminderEmail,
  sendDueTodayEmail,
  sendOverdueNoticeEmail,
} from "@/lib/email-with-logging";
import { createNotification } from "@/lib/notifications";

/**
 * Email Automation
 * ------------------------------------------------------------------
 * Single canonical entry point for the daily automated library emails.
 * Runs the three jobs directly in the server process (no internal HTTP
 * self-fetch, no QStash schedules).
 *
 *   Vercel Cron (vercel.json "0 9 * * *")
 *     -> POST /api/workflows/consolidated-daily-emails
 *         -> CRON_SECRET authorization
 *         -> runDailyEmailAutomation()
 *             -> runDueDateReminderJob()  (dueDate = tomorrow)
 *             -> runDueTodayJob()         (dueDate = today)
 *             -> runOverdueJob()          (dueDate < today)
 *
 * Deduplication is provided by the existing `email_logs` table, keyed on
 * (email_type, metadata.borrowRecordId). A SENT row of the same type for the
 * same borrow record suppresses a repeat send, so:
 *   - the due-date reminder (DUE_REMINDER) does NOT block the later overdue
 *     (OVERDUE_NOTICE) — they are different types;
 *   - the same manual & automatic send helpers log the same borrowRecordId,
 *     so a manual backup send prevents an automatic duplicate and vice versa;
 *   - a FAILED row does not block a retry on the next run.
 */

const PENALTY_PER_DAY = 0.5;

export interface JobResult {
  job: "due-tomorrow" | "due-today" | "overdue";
  matched: number;
  sent: number;
  skippedDuplicates: number;
  failed: number;
  dryRun: boolean;
  error?: string;
}

export function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function baseProfileUrl(): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"}/my-profile`;
}

/**
 * Returns true if an email of `emailType` for `borrowRecordId` was already
 * SENT (persisted in email_logs.metadata as JSON `{ borrowRecordId }`).
 */
export async function hasEmailBeenSent(
  emailType: string,
  borrowRecordId: string
): Promise<boolean> {
  const existing = await db
    .select({ id: emailLogs.id })
    .from(emailLogs)
    .where(
      and(
        eq(emailLogs.emailType, emailType as never),
        eq(emailLogs.status, "SENT"),
        sql`${emailLogs.metadata}::jsonb ->> 'borrowRecordId' = ${borrowRecordId}`
      )
    )
    .limit(1);
  return existing.length > 0;
}

/* ─────────────────────────── Due Date Reminder ─────────────────────────── */

export async function runDueDateReminderJob({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<JobResult> {
  const result: JobResult = {
    job: "due-tomorrow",
    matched: 0,
    sent: 0,
    skippedDuplicates: 0,
    failed: 0,
    dryRun,
  };

  const tomorrow = addDays(new Date(), 1);
  const tomorrowString = toDateString(tomorrow);

  const booksDueTomorrow = await db
    .select({
      borrowRecordId: borrowRecords.id,
      userId: users.id,
      userEmail: users.email,
      userName: users.fullName,
      bookTitle: books.title,
      bookAuthor: books.author,
      dueDate: borrowRecords.dueDate,
    })
    .from(borrowRecords)
    .innerJoin(users, eq(borrowRecords.userId, users.id))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.status, "BORROWED"),
        eq(borrowRecords.dueDate, tomorrowString),
        isNull(borrowRecords.returnDate)
      )
    );

  result.matched = booksDueTomorrow.length;

  for (const record of booksDueTomorrow) {
    try {
      if (await hasEmailBeenSent("DUE_REMINDER", record.borrowRecordId)) {
        result.skippedDuplicates++;
        continue;
      }
      if (dryRun) {
        result.sent++;
        continue;
      }

      // Emit an admin notification (best-effort; a failure here is logged and
      // swallowed so it never stops the automation job or the email itself).
      await createNotification({
        userId: record.userId,
        category: "BOOK",
        type: "BOOK_DUE_SOON",
        title: "Book Due Soon",
        message: `${record.userName || "A library member"} has "${
          record.bookTitle || "a book"
        }" due tomorrow.`,
        entityType: "BORROW_RECORD",
        entityId: record.borrowRecordId,
      });

      const emailHtml = await render(
        DueDateReminderEmail({
          userName: record.userName || "Library Member",
          bookTitle: record.bookTitle || "Unknown Book",
          bookAuthor: record.bookAuthor || "Unknown Author",
          dueDate: formatDate(new Date(record.dueDate)),
          profileUrl: baseProfileUrl(),
        })
      );

      await sendDueReminderEmail(
        record.userEmail!,
        record.userName || "Library Member",
        emailHtml,
        record.bookTitle || "Unknown Book",
        { triggerSource: "AUTOMATION", borrowRecordId: record.borrowRecordId }
      );

      result.sent++;
    } catch (err) {
      result.failed++;
      console.error(
        `[email-automation] Failed due-date reminder for ${record.userEmail} (${record.bookTitle}):`,
        err
      );
    }
  }

  return result;
}
/* ─────────────────────────────── Due Today ─────────────────────────────── */

export async function runDueTodayJob({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<JobResult> {
  const result: JobResult = {
    job: "due-today",
    matched: 0,
    sent: 0,
    skippedDuplicates: 0,
    failed: 0,
    dryRun,
  };

  const today = new Date();
  const todayString = toDateString(today);

  const booksDueToday = await db
    .select({
      borrowRecordId: borrowRecords.id,
      userEmail: users.email,
      userName: users.fullName,
      bookTitle: books.title,
      bookAuthor: books.author,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
    })
    .from(borrowRecords)
    .innerJoin(users, eq(borrowRecords.userId, users.id))
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.status, "BORROWED"),
        eq(borrowRecords.dueDate, todayString),
        isNull(borrowRecords.returnDate)
      )
    );

  result.matched = booksDueToday.length;

  for (const record of booksDueToday) {
    try {
      if (await hasEmailBeenSent("DUE_TODAY", record.borrowRecordId)) {
        result.skippedDuplicates++;
        continue;
      }
      if (dryRun) {
        result.sent++;
        continue;
      }

      const borrowDate = new Date(record.borrowDate);
      const dueDate = new Date(record.dueDate);
      const loanDuration = Math.ceil(
        (dueDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const emailHtml = await render(
        BookDueTodayEmail({
          userName: record.userName || "Library Member",
          bookTitle: record.bookTitle || "Unknown Book",
          bookAuthor: record.bookAuthor || "Unknown Author",
          borrowDate: formatDate(borrowDate),
          dueDate: formatDate(dueDate),
          loanDuration,
          profileUrl: baseProfileUrl(),
        })
      );

      await sendDueTodayEmail(
        record.userEmail!,
        record.userName || "Library Member",
        emailHtml,
        record.bookTitle || "Unknown Book",
        { triggerSource: "AUTOMATION", borrowRecordId: record.borrowRecordId }
      );

      result.sent++;
    } catch (err) {
      result.failed++;
      console.error(
        `[email-automation] Failed due-today email for ${record.userEmail} (${record.bookTitle}):`,
        err
      );
    }
  }

  return result;
}


/* ─────────────────────────────── Overdue ───────────────────────────────── */

export async function runOverdueJob({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<JobResult> {
  const result: JobResult = {
    job: "overdue",
    matched: 0,
    sent: 0,
    skippedDuplicates: 0,
    failed: 0,
    dryRun,
  };

  const today = new Date();
  const todayString = toDateString(today);

  const overdueRecords = await db
    .select({
      borrowRecordId: borrowRecords.id,
      userId: users.id,
      userFullName: users.fullName,
      userEmail: users.email,
      bookTitle: books.title,
      bookAuthor: books.author,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
    })
    .from(borrowRecords)
    .leftJoin(users, eq(borrowRecords.userId, users.id))
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .where(
      and(
        eq(borrowRecords.status, "BORROWED"),
        lt(borrowRecords.dueDate, todayString),
        isNull(borrowRecords.returnDate)
      )
    );

  result.matched = overdueRecords.length;

  for (const record of overdueRecords) {
    try {
      const dueDate = new Date(record.dueDate);
      const daysOverdue = Math.ceil(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOverdue < 1) continue;

      if (await hasEmailBeenSent("OVERDUE_NOTICE", record.borrowRecordId)) {
        result.skippedDuplicates++;
        continue;
      }
      if (dryRun) {
        result.sent++;
        continue;
      }

      // Emit an admin notification (best-effort; a failure here is logged and
      // swallowed so it never stops the automation job or the email itself).
      await createNotification({
        userId: record.userId,
        category: "BOOK",
        type: "BOOK_OVERDUE",
        title: "Book Overdue",
        message: `${record.userFullName || "A library member"} has "${
          record.bookTitle || "a book"
        }" overdue.`,
        entityType: "BORROW_RECORD",
        entityId: record.borrowRecordId,
      });

      const penaltyAmount = daysOverdue * PENALTY_PER_DAY;

      const emailHtml = await render(
        OverdueBookEmail({
          userName: record.userFullName || "Library Member",
          bookTitle: record.bookTitle || "Unknown Book",
          bookAuthor: record.bookAuthor || "Unknown Author",
          borrowDate: formatDate(new Date(record.borrowDate)),
          dueDate: formatDate(dueDate),
          daysOverdue,
          penaltyAmount,
          returnBookUrl: baseProfileUrl(),
        })
      );

      await sendOverdueNoticeEmail(
        record.userEmail!,
        record.userFullName || "Library Member",
        emailHtml,
        record.bookTitle || "Unknown Book",
        daysOverdue,
        {
          triggerSource: "AUTOMATION",
          borrowRecordId: record.borrowRecordId,
          penaltyAmount,
        }
      );

      result.sent++;
    } catch (err) {
      result.failed++;
      console.error(
        `[email-automation] Failed overdue email for ${record.userEmail} (${record.bookTitle}):`,
        err
      );
    }
  }

  return result;
}

/* ─────────────────────────── Daily automation ──────────────────────────── */

/**
 * Runs all three automated email jobs sequentially. Each job is isolated, so a
 * failure in one job never stops the others. Returns per-job results.
 */
export async function runDailyEmailAutomation({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<JobResult[]> {
  const toErrorResult = (job: JobResult["job"], err: unknown): JobResult => ({
    job,
    matched: 0,
    sent: 0,
    skippedDuplicates: 0,
    failed: 0,
    dryRun,
    error: err instanceof Error ? err.message : "Unknown error",
  });

  const results: JobResult[] = [];

  try {
    results.push(await runDueDateReminderJob({ dryRun }));
  } catch (err) {
    console.error("[email-automation] due-tomorrow job failed:", err);
    results.push(toErrorResult("due-tomorrow", err));
  }

  try {
    results.push(await runDueTodayJob({ dryRun }));
  } catch (err) {
    console.error("[email-automation] due-today job failed:", err);
    results.push(toErrorResult("due-today", err));
  }

  try {
    results.push(await runOverdueJob({ dryRun }));
  } catch (err) {
    console.error("[email-automation] overdue job failed:", err);
    results.push(toErrorResult("overdue", err));
  }

  return results;
}

