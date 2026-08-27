"use server";

/**
 * lib/admin/actions/messages.ts
 *
 * ADMIN-only management of Contact Us / feedback messages:
 *  - getAdminMessages(searchTerm, statusFilter, sortOrder) -> rows + total
 *  - getAdminMessageById(id)                               -> full message
 *  - updateMessageStatus(id, status)                       -> status change
 *
 * Every action re-checks the caller role against the database via
 * isAdminUser() -- route protection in app/admin/layout.tsx alone is not
 * enough, because server actions can be invoked directly.
 */

import { revalidatePath } from "next/cache";
import { and, count, desc, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database/drizzle";
import { users, contactMessages } from "@/database/schema";
import { MESSAGE_STATUSES, type MessageStatus } from "@/lib/validations";
import { isAdminUser } from "@/lib/auth-guard";

const zUuid = z.string().uuid();
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/* ---------------------------------- types --------------------------------- */

export type AdminMessage = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  name: string;
  email: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type GetMessagesResponse = {
  success: boolean;
  data?: AdminMessage[];
  total?: number;
};

export type SingleMessageResponse = {
  success: boolean;
  data?: AdminMessage;
};

/* ------------------------------- list query ------------------------------- */

export async function getAdminMessages(
  searchTerm = "",
  statusFilter: string = "all", // "all" | "UNREAD" | "READ" | "RESOLVED"
  sortOrder: string = "latest", // "latest" | "oldest"
): Promise<GetMessagesResponse> {
  try {
    // Server-side role gate: actions can be invoked directly by anyone.
    if (!(await isAdminUser())) {
      return { success: false };
    }

    const trimmedSearch = searchTerm.trim();

    const conditions = [];
    if (
      statusFilter &&
      statusFilter.toLowerCase() !== "all" &&
      MESSAGE_STATUSES.includes(statusFilter.toUpperCase() as MessageStatus)
    ) {
      conditions.push(
        eq(contactMessages.status, statusFilter.toUpperCase() as MessageStatus),
      );
    }

    if (trimmedSearch) {
      const searchCondition = or(
        ilike(contactMessages.name, `%${trimmedSearch}%`),
        ilike(contactMessages.email, `%${trimmedSearch}%`),
        ilike(contactMessages.message, `%${trimmedSearch}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // THE SORT FIX: direction comes straight from the selected option and the
    // client always passes its current selection (default "latest"), so the
    // rendered order can never disagree with the sort dropdown label.
    const orderBy =
      sortOrder === "oldest"
        ? asc(contactMessages.createdAt)
        : desc(contactMessages.createdAt);

    // Total count matching the filters (for the result label).
    const [totalRow] = await db
      .select({ value: count() })
      .from(contactMessages)
      .where(whereClause);
    const totalCount = Number(totalRow?.value ?? 0);

    const rows = await db
      .select({
        id: contactMessages.id,
        userId: contactMessages.userId,
        userName: users.fullName,
        userEmail: users.email,
        name: contactMessages.name,
        email: contactMessages.email,
        message: contactMessages.message,
        status: contactMessages.status,
        createdAt: contactMessages.createdAt,
        updatedAt: contactMessages.updatedAt,
      })
      .from(contactMessages)
      .leftJoin(users, eq(users.id, contactMessages.userId))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(FETCH_LIMIT);

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        status: row.status as MessageStatus,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      total: totalCount,
    };
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return { success: false };
  }
}

const FETCH_LIMIT = 100;

/* ------------------------------ read single ------------------------------- */

export async function getAdminMessageById(
  id: string,
): Promise<SingleMessageResponse> {
  try {
    if (!(await isAdminUser())) {
      return { success: false };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false };
    }

    const [row] = await db
      .select({
        id: contactMessages.id,
        userId: contactMessages.userId,
        userName: users.fullName,
        userEmail: users.email,
        name: contactMessages.name,
        email: contactMessages.email,
        message: contactMessages.message,
        status: contactMessages.status,
        createdAt: contactMessages.createdAt,
        updatedAt: contactMessages.updatedAt,
      })
      .from(contactMessages)
      .leftJoin(users, eq(users.id, contactMessages.userId))
      .where(eq(contactMessages.id, parsedId.data))
      .limit(1);

    if (!row) {
      return { success: false };
    }

    return {
      success: true,
      data: {
        ...row,
        status: row.status as MessageStatus,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching contact message:", error);
    return { success: false };
  }
}

/* ------------------------------ status updates ---------------------------- */

export type StatusUpdateResponse = {
  success: boolean;
  error?: string;
};

export async function updateMessageStatus(
  messageId: string,
  newStatus: string,
): Promise<StatusUpdateResponse> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "You do not have permission to do this." };
    }

    const parsedId = zUuid.safeParse(messageId);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false, error: "Invalid message." };
    }

    const normalized = newStatus?.toUpperCase?.();
    if (!normalized || !MESSAGE_STATUSES.includes(normalized as MessageStatus)) {
      return { success: false, error: "Invalid status value." };
    }

    const result = await db
      .update(contactMessages)
      .set({ status: normalized as MessageStatus, updatedAt: new Date() })
      .where(eq(contactMessages.id, parsedId.data))
      .returning({ id: contactMessages.id });

    if (result.length === 0) {
      return { success: false, error: "Message not found." };
    }

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Error updating message status:", error);
    return {
      success: false,
      error: "Failed to update the message status. Please try again.",
    };
  }
}
