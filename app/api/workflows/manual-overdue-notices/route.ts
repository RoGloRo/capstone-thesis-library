import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords, books, users } from "@/database/schema";
import { and, eq, lt, isNull } from "drizzle-orm";
import { render } from "@react-email/render";
import OverdueBookEmail from "@/emails/OverdueBookEmail";
import { workflowClient } from "@/lib/workflow";
import { emailLogs } from "@/database/schema";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    const overdueRecords = await db
      .select({
        borrowRecordId: borrowRecords.id,
        userId: borrowRecords.userId,
        bookId: borrowRecords.bookId,
        borrowDate: borrowRecords.borrowDate,
        dueDate: borrowRecords.dueDate,
        userFullName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        bookAuthor: books.author,
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

    // Create a unique trigger id for this manual run
    const triggerId = crypto.randomUUID();

    // Filter out any records that are not actually overdue (safety)
    const overdueList = overdueRecords.filter((r) => {
      const due = new Date(r.dueDate);
      const daysOverdue = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue >= 1;
    });

    const totalRecipients = overdueList.length;

    // Insert a summary log entry to indicate manual trigger queued
    try {
      await db.insert(emailLogs).values({
        recipientEmail: `manual-overdue-trigger+${triggerId}@local`,
        recipientName: "ADMIN",
        emailType: "OVERDUE_NOTICE",
        status: "PENDING",
        subject: `Manual overdue trigger ${triggerId}`,
        metadata: JSON.stringify({ triggerSource: "ADMIN", triggeredBy: "ADMIN", triggerId, totalRecipients }),
      });
    } catch (logErr) {
      console.warn("Failed to write manual trigger summary to email_logs:", logErr);
    }

    // Batch and enqueue work via Upstash Workflow to process asynchronously when possible.
    const configuredBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "";
    const baseUrl = configuredBase || `http://127.0.0.1:${process.env.PORT || 3000}`;
    const { isLoopbackHost } = await import("@/lib/manual-overdue-processor");
    const hostname = (() => {
      try {
        return new URL(baseUrl).hostname;
      } catch (e) {
        return "";
      }
    })();

    const batchSize = 100;
    let queuedBatches = 0;

    // If baseUrl is loopback or not configured for public access, process locally in background
    if (!configuredBase || isLoopbackHost(hostname)) {
      // Process locally asynchronously to avoid blocking the response
      (async () => {
        const { processOverdueBatch } = await import("@/lib/manual-overdue-processor");

        for (let i = 0; i < overdueList.length; i += batchSize) {
          const batch = overdueList.slice(i, i + batchSize).map((r) => ({
            borrowRecordId: r.borrowRecordId,
            userEmail: r.userEmail,
            userFullName: r.userFullName,
            bookTitle: r.bookTitle,
            bookAuthor: r.bookAuthor,
            borrowDate: r.borrowDate,
            dueDate: r.dueDate,
          }));

          try {
            await processOverdueBatch(triggerId, batch);
            queuedBatches++;
          } catch (err) {
            console.error("Local processor error for manual-overdue batch:", err);
          }
        }
      })();

      return NextResponse.json({
        success: true,
        triggerId,
        totalOverdue: overdueRecords.length,
        totalQueuedBatches: Math.ceil(overdueList.length / batchSize),
        totalRecipients,
        note: "Processed locally (development) - set NEXT_PUBLIC_BASE_URL to a public URL to enqueue via Upstash",
      });
    }

    // Otherwise enqueue via Upstash Workflow
    for (let i = 0; i < overdueList.length; i += batchSize) {
      const batch = overdueList.slice(i, i + batchSize).map((r) => ({
        borrowRecordId: r.borrowRecordId,
        userEmail: r.userEmail,
        userFullName: r.userFullName,
        bookTitle: r.bookTitle,
        bookAuthor: r.bookAuthor,
        borrowDate: r.borrowDate,
        dueDate: r.dueDate,
      }));

      // Enqueue batch for asynchronous processing
      await workflowClient.trigger({
        url: `${baseUrl}/api/workflows/manual-overdue-worker`,
        body: {
          triggerId,
          records: batch,
        },
      });

      queuedBatches++;
    }

    return NextResponse.json({
      success: true,
      triggerId,
      totalOverdue: overdueRecords.length,
      totalQueuedBatches: queuedBatches,
      totalRecipients,
    });
  } catch (error) {
    console.error("Error in manual overdue notices:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
