import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { borrowRecords } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { borrowRecordId, daysFromNow } = await request.json();
    
    if (!borrowRecordId || daysFromNow === undefined) {
      return NextResponse.json(
        { error: "borrowRecordId and daysFromNow are required" },
        { status: 400 }
      );
    }

    // Calculate the target due date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    const dueDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Update the borrow record's due date
    const [updatedRecord] = await db
      .update(borrowRecords)
      .set({ 
        dueDate: dueDateString,
        // Reset reminder sent flag if column exists
        // dueDateReminderSent: false 
      })
      .where(eq(borrowRecords.id, borrowRecordId))
      .returning();

    if (!updatedRecord) {
      return NextResponse.json(
        { error: "Borrow record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated borrow record due date to ${dueDateString} (${daysFromNow} days from now)`,
      record: {
        id: updatedRecord.id,
        dueDate: updatedRecord.dueDate,
        status: updatedRecord.status,
      },
    });

  } catch (error) {
    console.error("Error updating due date:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}