import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { borrowRecordId, action = "set-due-today" } = body;

    if (!borrowRecordId) {
      return NextResponse.json(
        { success: false, error: "borrowRecordId is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    if (action === "set-due-today") {
      // Update the borrow record to make it due today
      const [updatedRecord] = await db
        .update(borrowRecords)
        .set({
          dueDate: todayDateString,
          // Reset reminder sent status for testing
          reminderSent: false 
        })
        .where(eq(borrowRecords.id, borrowRecordId))
        .returning();

      if (!updatedRecord) {
        return NextResponse.json(
          { success: false, error: "Borrow record not found" },
          { status: 404 }
        );
      }

      console.log(`📅 Set borrow record ${borrowRecordId} due date to today: ${todayDateString}`);

      return NextResponse.json({
        success: true,
        message: `Borrow record due date set to today: ${todayDateString}`,
        record: {
          id: updatedRecord.id,
          dueDate: updatedRecord.dueDate,
          reminderSent: updatedRecord.reminderSent,
        },
      });

    } else if (action === "set-due-tomorrow") {
      // Set due date to tomorrow (for testing tomorrow reminders)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().split('T')[0];

      const [updatedRecord] = await db
        .update(borrowRecords)
        .set({
          dueDate: tomorrowDateString,
          reminderSent: false
        })
        .where(eq(borrowRecords.id, borrowRecordId))
        .returning();

      if (!updatedRecord) {
        return NextResponse.json(
          { success: false, error: "Borrow record not found" },
          { status: 404 }
        );
      }

      console.log(`📅 Set borrow record ${borrowRecordId} due date to tomorrow: ${tomorrowDateString}`);

      return NextResponse.json({
        success: true,
        message: `Borrow record due date set to tomorrow: ${tomorrowDateString}`,
        record: {
          id: updatedRecord.id,
          dueDate: updatedRecord.dueDate,
          reminderSent: updatedRecord.reminderSent,
        },
      });

    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Use 'set-due-today' or 'set-due-tomorrow'",
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("❌ Error updating due date:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update due date",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Due date test helper",
    usage: {
      setDueToday: "POST with { borrowRecordId: 'id', action: 'set-due-today' }",
      setDueTomorrow: "POST with { borrowRecordId: 'id', action: 'set-due-tomorrow' }",
    },
    description: "Helper endpoint for testing due date reminders by setting borrow record due dates",
  });
}