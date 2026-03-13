"use server";

import { db } from "@/database/drizzle";
import { visitLogs, users } from "@/database/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import dayjs from "dayjs";

// Record a library visit (with duplicate prevention within 10 minutes)
export async function recordVisit(userId: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    universityId: number;
    universityCard: string;
    email: string;
  };
}> {
  try {
    // Check if the user exists
    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        universityId: users.universityId,
        universityCard: users.universityCard,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Check for duplicate log within the last 10 minutes
    const tenMinutesAgo = dayjs().subtract(10, "minute").toISOString();
    const recentLog = await db
      .select({ id: visitLogs.id })
      .from(visitLogs)
      .where(
        and(
          eq(visitLogs.userId, userId),
          gte(visitLogs.createdAt, new Date(tenMinutesAgo))
        )
      )
      .limit(1);

    if (recentLog.length > 0) {
      return {
        success: false,
        message: "Visit already recorded recently. Please wait at least 10 minutes.",
        user,
      };
    }

    // Record the visit
    const now = dayjs();
    const visitDate = now.format("YYYY-MM-DD");
    const visitTime = now.format("hh:mm A");

    await db.insert(visitLogs).values({
      userId,
      visitDate,
      visitTime,
    });

    return {
      success: true,
      message: `Welcome to the Library, ${user.fullName}!`,
      user,
    };
  } catch (error) {
    console.error("Error recording visit:", error);
    return { success: false, message: "Failed to record visit. Please try again." };
  }
}

// Get visit logs with optional date filter
export async function getVisitLogs(filter: "today" | "week" | "month" | "all" = "today") {
  const now = dayjs();
  let startDate: string | undefined;
  let endDate: string | undefined = now.format("YYYY-MM-DD");

  if (filter === "today") {
    startDate = now.format("YYYY-MM-DD");
  } else if (filter === "week") {
    startDate = now.startOf("week").format("YYYY-MM-DD");
  } else if (filter === "month") {
    startDate = now.startOf("month").format("YYYY-MM-DD");
  }

  const conditions = [];
  if (startDate) conditions.push(gte(visitLogs.visitDate, startDate));
  if (endDate && filter !== "today" && filter !== "all") {
    conditions.push(lte(visitLogs.visitDate, endDate));
  }
  if (filter === "today") {
    conditions.push(eq(visitLogs.visitDate, startDate!));
  }

  const rows = await db
    .select({
      id: visitLogs.id,
      visitDate: visitLogs.visitDate,
      visitTime: visitLogs.visitTime,
      createdAt: visitLogs.createdAt,
      userId: users.id,
      fullName: users.fullName,
      universityId: users.universityId,
      email: users.email,
    })
    .from(visitLogs)
    .leftJoin(users, eq(visitLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(visitLogs.createdAt));

  return rows;
}

// Get visit statistics
export async function getVisitStats() {
  const today = dayjs().format("YYYY-MM-DD");
  const weekStart = dayjs().startOf("week").format("YYYY-MM-DD");

  const [todayCount] = await db
    .select({ count: count() })
    .from(visitLogs)
    .where(eq(visitLogs.visitDate, today));

  const [weekCount] = await db
    .select({ count: count() })
    .from(visitLogs)
    .where(gte(visitLogs.visitDate, weekStart));

  // Most frequent visitors this month
  const monthStart = dayjs().startOf("month").format("YYYY-MM-DD");
  const topVisitors = await db
    .select({
      userId: visitLogs.userId,
      fullName: users.fullName,
      universityId: users.universityId,
      visitCount: count(visitLogs.id),
    })
    .from(visitLogs)
    .leftJoin(users, eq(visitLogs.userId, users.id))
    .where(gte(visitLogs.visitDate, monthStart))
    .groupBy(visitLogs.userId, users.fullName, users.universityId)
    .orderBy(desc(count(visitLogs.id)))
    .limit(5);

  return {
    todayCount: todayCount?.count ?? 0,
    weekCount: weekCount?.count ?? 0,
    topVisitors,
  };
}
