"use server";

/**
 * lib/actions/notifications.ts
 *
 * Session-scoped (user-facing) server actions for the User Notification
 * Center: the header bell popover and the /notifications page.
 *
 *  - getUserNotifications(...)          -> filtered/paginated inbox + total
 *  - getUnreadUserNotificationCount()   -> unread badge count
 *  - markUserNotificationAsRead(id)     -> mark ONE notification read
 *  - markAllUserNotificationsAsRead()   -> mark everything read
 *
 * SECURITY: every action resolves the caller from the next-auth session via
 * getAuthenticatedUserId() — a client-supplied userId is never trusted — and
 * every query/update is additionally filtered by that user id, so one user can
 * never read or mutate another user's notifications (no IDOR).
 *
 * The inbox is the user_notifications table (per-user rows, per-user read
 * state). It is intentionally separate from both email_logs and the admin
 * `notifications` activity feed.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database/drizzle";
import { userNotifications } from "@/database/schema";
import { getAuthenticatedUserId } from "@/lib/auth-guard";
import type { UserNotificationType } from "@/lib/notifications";

const zUuid = z.string().uuid();
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/* ---------------------------------- types --------------------------------- */

export type UserNotificationRow = {
  id: string;
  type: UserNotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export interface GetUserNotificationsParams {
  filter?: string; // "all" (default) | "unread"
  page?: number;
  pageSize?: number;
}

export type GetUserNotificationsResponse = {
  success: boolean;
  data?: UserNotificationRow[];
  total?: number;
};

/* --------------------------------- list ----------------------------------- */

export async function getUserNotifications(
  params: GetUserNotificationsParams = {},
): Promise<GetUserNotificationsResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false };
    }

    const filter = params.filter === "unread" ? "unread" : "all";
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Math.floor(params.pageSize ?? 15)),
    );

    const conditions = [eq(userNotifications.userId, userId)];
    if (filter === "unread") {
      conditions.push(eq(userNotifications.isRead, false));
    }
    const whereClause = and(...conditions);

    const [totalRow] = await db
      .select({ value: count() })
      .from(userNotifications)
      .where(whereClause);
    const total = Number(totalRow?.value ?? 0);

    // Newest first — the default query genuinely returns newest-first.
    const rows = await db
      .select({
        id: userNotifications.id,
        type: userNotifications.type,
        title: userNotifications.title,
        message: userNotifications.message,
        link: userNotifications.link,
        isRead: userNotifications.isRead,
        createdAt: userNotifications.createdAt,
      })
      .from(userNotifications)
      .where(whereClause)
      .orderBy(desc(userNotifications.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        type: row.type as UserNotificationType,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return { success: false };
  }
}

/* ------------------------------ unread count ------------------------------ */

export async function getUnreadUserNotificationCount(): Promise<number> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return 0;

    const [row] = await db
      .select({ value: count() })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, false),
        ),
      );

    return Number(row?.value ?? 0);
  } catch (error) {
    console.error("Error fetching unread user notification count:", error);
    return 0;
  }
}

/* ---------------------------- mark one as read ---------------------------- */

export async function markUserNotificationAsRead(
  id: string,
): Promise<{ success: boolean }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false };
    }

    // Ownership is enforced by the userId filter: another user's notification
    // id simply matches nothing.
    await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(userNotifications.id, parsedId.data),
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error marking user notification as read:", error);
    return { success: false };
  }
}

/* ---------------------------- mark all as read ---------------------------- */

export async function markAllUserNotificationsAsRead(): Promise<{
  success: boolean;
}> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false };
    }

    await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error marking all user notifications as read:", error);
    return { success: false };
  }
}