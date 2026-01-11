import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { emailLogs } from "@/database/schema";
import { eq } from "drizzle-orm";
import { processOverdueBatch } from "@/lib/manual-overdue-processor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { triggerId, records } = body as { triggerId: string; records: Array<any> };

    if (!triggerId || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const { sent, failed } = await processOverdueBatch(triggerId, records);

    return NextResponse.json({ success: true, triggerId, sent, failed });
  } catch (error) {
    console.error("Error in manual overdue worker:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
