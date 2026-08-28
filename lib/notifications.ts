// lib/notifications.ts
//
// Server-side helper for creating Admin Notification Center events. It is
// deliberately NOT a "use server" file and NOT exposed to the client: the
// browser must never be able to create arbitrary admin notifications.
//
// Notification creation is an AUXILIARY concern by design:
//   - It runs from within existing server-side business workflows.
//   - A failure to insert a notification is caught, logged and swallowed, so it
//     can NEVER cause the underlying business action (borrow / return / signup /
//     submit contact message / account approval / rejection / automation job)
//     to fail.
//   - Messages are plain text built from server-side data (no HTML, no
//     dangerouslySetInnerHTML anywhere downstream).
//   - Dedup is enforced by the (type, entity_type, entity_id) unique index via
//     ON CONFLICT DO NOTHING, so re-run/idempotent workflows cannot duplicate.

import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { sql } from "drizzle-orm";

export const NOTIFICATION_CATEGORIES = [
  "BOOK",
  "ACCOUNT",
  "MESSAGE",
  "SYSTEM",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_TYPES = [
  "BOOK_BORROWED",
  "BOOK_RETURNED",
  "BOOK_DUE_SOON",
  "BOOK_OVERDUE",
  "ACCOUNT_REQUEST",
  "ACCOUNT_APPROVED",
  "ACCOUNT_REJECTED",
  "NEW_MESSAGE",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationEntityType =
  | "BORROW_RECORD"
  | "CONTACT_MESSAGE"
  | "ACCOUNT_REQUEST"
  | "BOOK";

export interface CreateNotificationInput {
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
}

/**
 * Creates a single notification. Returns true if a row was inserted, false if a
 * duplicate was skipped or if an error occurred (error is logged, never thrown).
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<boolean> {
  try {
    await db
      .insert(notifications)
      .values({
        category: input.category,
        type: input.type,
        title: input.title,
        message: input.message,
        userId: input.userId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      })
      .onConflictDoNothing({
        target: [
          notifications.type,
          notifications.entityType,
          notifications.entityId,
        ],
      });
    return true;
  } catch (error) {
    console.error("[notifications] Failed to create notification:", error);
    return false;
  }
}

/* ─────────────────────── User Notification Center ────────────────────────── */

export const USER_NOTIFICATION_TYPES = ["ANNOUNCEMENT", "NEW_BOOK"] as const;
export type UserNotificationType = (typeof USER_NOTIFICATION_TYPES)[number];

export type UserNotificationEntityType = "ANNOUNCEMENT" | "BOOK";

export interface NotifyApprovedUsersInput {
  type: UserNotificationType;
  title: string;
  message: string;
  /** Server-generated INTERNAL route, e.g. "/announcements/{uuid}". */
  link: string;
  entityType: UserNotificationEntityType;
  entityId: string;
}

/**
 * Fans a notification out to every APPROVED user in a SINGLE parameterized
 * INSERT ... SELECT statement (no per-user round trips). The
 * (user_id, type, entity_id) unique index plus ON CONFLICT DO NOTHING makes
 * the fan-out idempotent: re-publishing, restoring or double-triggering the
 * same event never duplicates a user's notification.
 *
 * Like createNotification, this is auxiliary: a failure is logged and
 * swallowed so it can NEVER fail the business action that triggered it.
 */
export async function notifyApprovedUsers(
  input: NotifyApprovedUsersInput,
): Promise<boolean> {
  try {
    await db.execute(sql`
      INSERT INTO user_notifications
        (user_id, type, title, message, link, entity_type, entity_id)
      SELECT
        id,
        ${input.type}::user_notification_type,
        ${input.title},
        ${input.message},
        ${input.link},
        ${input.entityType},
        ${input.entityId}::uuid
      FROM users
      WHERE status = 'APPROVED'
      ON CONFLICT (user_id, type, entity_id) DO NOTHING
    `);
    return true;
  } catch (error) {
    console.error(
      "[notifications] Failed to create user notifications:",
      error,
    );
    return false;
  }
}