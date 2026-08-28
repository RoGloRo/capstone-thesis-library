"use server";

/**
 * lib/admin/actions/notifications.ts
 *
 * Admin-only server actions for the Admin Notification Center.
 *  - getNotifications(...)        -> filtered/sorted/paginated list + total
 *  - getUnreadNotificationCount() -> count of unread, for the header bell
 *  - markNotificationAsRead(id)   -> mark one notification read
 *  - markAllNotificationsAsRead() -> mark everything read
 *
 * Every action re-checks the caller's role against the database via
 * isAdminUser() -- route protection in app/admin/layout.tsx alone is not enough
 * because server actions can be invoked directly.
 *
 * Notifications are never deleted here. Read state is a boolean flip, not a
 * deletion.
 */

import { and, asc, count, desc, eq, gte, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  type NotificationCategory,
  type NotificationType,
} from "@/lib/notifications";
import { isAdminUser } from "@/lib/auth-guard";

const zUuid = z.string().uuid();
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

const CATEGORIES = new Set<string>(NOTIFICATION_CATEGORIES);
const TYPES = new Set<string>(NOTIFICATION_TYPES);

/* ---------------------------------- types --------------------------------- */

export type NotificationRow = {
  id: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  userId: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
};

export interface GetNotificationsParams {
  category?: string; // "ALL" (default) | a real category
  search?: string;
  read?: string; // "all" | "unread" | "read"
  eventType?: string; // "all" | one of NOTIFICATION_TYPES
  dateRange?: string; // "all" | "today" | "week" | "month"
  sort?: string; // "latest" | "oldest"
  page?: number;
  pageSize?: number;
}

export type GetNotificationsResponse = {
  success: boolean;
  data?: NotificationRow[];
  total?: number;
};

export async function getNotifications(
  params: GetNotificationsParams = {},
): Promise<GetNotificationsResponse> {
  try {
    if (!(await isAdminUser())) {
      return { success: false };
    }

    const category = params.category ?? "ALL";
    const search = (params.search ?? "").trim();
    const read = params.read ?? "all";
    const eventType = params.eventType ?? "all";
    const dateRange = params.dateRange ?? "all";
    const sort = params.sort === "oldest" ? "oldest" : "latest";

    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Math.floor(params.pageSize ?? 10)),
    );

    const conditions = [];

    // Category filter ("ALL" is a UI-only concept, never a DB value).
    if (category && category !== "ALL" && CATEGORIES.has(category)) {
      conditions.push(
        eq(notifications.category, category as NotificationCategory),
      );
    }

    // Read-status filter.
    if (read === "unread") {
      conditions.push(eq(notifications.isRead, false));
    } else if (read === "read") {
      conditions.push(eq(notifications.isRead, true));
    }

    // Event-type filter (context-aware from the client; validated).
    if (eventType && eventType !== "all" && TYPES.has(eventType)) {
      conditions.push(eq(notifications.type, eventType as NotificationType));
    }

    // Date filter (createdAt >= start of the window).
    if (dateRange !== "all") {
      const start = startOfRange(dateRange);
      if (start) {
        conditions.push(gte(notifications.createdAt, start));
      }
    }

    // Server-side search over title + message (message embeds user name/email
    // and book title where applicable). Parameterized ilike, no concatenation.
    if (search) {
      const pattern = `%${search}%`;
      const searchCondition = or(
        ilike(notifications.title, pattern),
        ilike(notifications.message, pattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // THE SORT FIX: the default "latest" maps to desc(createdAt), so the very
    // first query genuinely returns newest-first. "oldest" maps to asc().
    const orderBy =
      sort === "oldest"
        ? asc(notifications.createdAt)
        : desc(notifications.createdAt);
const [totalRow] = await db
      .select({ value: count() })
      .from(notifications)
      .where(whereClause);
    const total = Number(totalRow?.value ?? 0);

    const rows = await db
      .select({
        id: notifications.id,
        category: notifications.category,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        userId: notifications.userId,
        entityType: notifications.entityType,
        entityId: notifications.entityId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        category: row.category as NotificationCategory,
        type: row.type as NotificationType,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false };
  }
}

/* ---------------------------- unread count -------------------------------- */

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    if (!(await isAdminUser())) return 0;

    const [row] = await db
      .select({ value: count() })
      .from(notifications)
      .where(eq(notifications.isRead, false));

    return Number(row?.value ?? 0);
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
}

/* --------------------------- mark one as read ----------------------------- */

export async function markNotificationAsRead(
  id: string,
): Promise<{ success: boolean }> {
  try {
    if (!(await isAdminUser())) {
      return { success: false };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false };
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, parsedId.data),
          eq(notifications.isRead, false),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }
}
/* ---------------------- remaining actions & helpers ----------------------- */

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
}> {
  try {
    if (!(await isAdminUser())) {
      return { success: false };
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false));

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }
}

function startOfRange(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    case "week": {
      const day = now.getDay(); // 0 = Sunday
      const diff = day === 0 ? 6 : day - 1; // Monday as start
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      monday.setDate(monday.getDate() - diff);
      return monday;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}