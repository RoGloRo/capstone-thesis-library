"use server";

/**
 * lib/admin/actions/announcements.ts
 *
 * Admin-only server actions for the announcement system.
 *  - getAnnouncements(...)     -> filtered/sorted/paginated list + total
 *  - getAnnouncementById(id)   -> single announcement (edit page)
 *  - createAnnouncement(...)   -> save as draft or publish immediately
 *  - updateAnnouncement(...)   -> save changes (status untouched) / publish
 *  - publishAnnouncement(id)   -> DRAFT|ARCHIVED -> PUBLISHED (restore)
 *  - archiveAnnouncement(id)   -> PUBLISHED -> ARCHIVED (publishedAt kept)
 *  - deleteAnnouncement(id)    -> permanent delete (text-only, no media)
 *
 * Every action re-checks the caller's role against the database via
 * isAdminUser() — route protection in app/admin/layout.tsx alone is not
 * enough because server actions can be invoked directly.
 *
 * Lifecycle: DRAFT -> PUBLISHED -> ARCHIVED. Publishing stamps publishedAt
 * only the FIRST time; re-publishing an archived or already-published
 * announcement never overwrites the original publication date, and publish
 * is a single-row UPDATE — it never creates duplicates.
 *
 * Deliberately NOT integrated with the Admin Notification Center: the
 * librarian is the actor, so notifying admins about their own announcement
 * actions would only create noise.
 */

import { and, asc, count, desc, eq, gte, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/database/drizzle";
import { announcements } from "@/database/schema";
import { isAdminUser } from "@/lib/auth-guard";
import { notifyApprovedUsers } from "@/lib/notifications";
import {
  ANNOUNCEMENT_STATUSES,
  announcementSchema,
  type AnnouncementInput,
  type AnnouncementStatus,
} from "@/lib/validations";

const zUuid = z.string().uuid();
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

const STATUSES = new Set<string>(ANNOUNCEMENT_STATUSES);

/* ---------------------------------- types --------------------------------- */

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface GetAnnouncementsParams {
  status?: string; // "all" (default) | DRAFT | PUBLISHED | ARCHIVED
  search?: string;
  dateRange?: string; // "all" | "today" | "week" | "month"
  sort?: string; // "newest" (default) | "oldest"
  page?: number;
  pageSize?: number;
}

export type GetAnnouncementsResponse = {
  success: boolean;
  data?: AnnouncementRow[];
  total?: number;
};

export type MutationResult = {
  success: boolean;
  error?: string;
  id?: string;
};

/* -------------------------------- helpers --------------------------------- */

type DbAnnouncementRow = {
  id: string;
  title: string;
  content: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeRow(row: DbAnnouncementRow): AnnouncementRow {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status as AnnouncementStatus,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function revalidateAnnouncementPaths() {
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}

function startOfRange(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - 6);
      return start;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

/* ------------------------------ list (admin) ------------------------------ */

export async function getAnnouncements(
  params: GetAnnouncementsParams = {},
): Promise<GetAnnouncementsResponse> {
  try {
    if (!(await isAdminUser())) {
      return { success: false };
    }

    const status = params.status ?? "all";
    const search = (params.search ?? "").trim().slice(0, 200);
    const dateRange = params.dateRange ?? "all";
    const sort = params.sort === "oldest" ? "oldest" : "newest";

    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Math.floor(params.pageSize ?? 10)),
    );

    const conditions = [];

    // Status filter ("all" is a UI-only concept, never a DB value).
    if (status !== "all" && STATUSES.has(status)) {
      conditions.push(eq(announcements.status, status as AnnouncementStatus));
    }

    // Date filter (createdAt >= start of the window).
    if (dateRange !== "all") {
      const start = startOfRange(dateRange);
      if (start) {
        conditions.push(gte(announcements.createdAt, start));
      }
    }

    // Server-side search over title + content. Parameterized ilike, no
    // string concatenation.
    if (search) {
      const pattern = `%${search}%`;
      const searchCondition = or(
        ilike(announcements.title, pattern),
        ilike(announcements.content, pattern),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ value: count() })
      .from(announcements)
      .where(whereClause);
    const total = Number(totalRow?.value ?? 0);

    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        status: announcements.status,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .where(whereClause)
      .orderBy(
        sort === "oldest"
          ? asc(announcements.createdAt)
          : desc(announcements.createdAt),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      success: true,
      data: rows.map(serializeRow),
      total,
    };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false };
  }
}

/* ------------------------------ get by id --------------------------------- */

export async function getAnnouncementById(
  id: string,
): Promise<{ success: boolean; announcement?: AnnouncementRow }> {
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
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        status: announcements.status,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .where(eq(announcements.id, parsedId.data))
      .limit(1);

    if (!row) {
      return { success: false };
    }

    return { success: true, announcement: serializeRow(row) };
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return { success: false };
  }
}

/* -------------------------------- create ---------------------------------- */

export async function createAnnouncement(
  input: AnnouncementInput,
  action: "save" | "publish" = "save",
): Promise<MutationResult> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized." };
    }

    // Server-side re-validation — the client form is UX only.
    const parsed = announcementSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed. Please check the title and content.",
      };
    }

    const isPublish = action === "publish";
    const [row] = await db
      .insert(announcements)
      .values({
        title: parsed.data.title,
        content: parsed.data.content,
        status: isPublish ? "PUBLISHED" : "DRAFT",
        publishedAt: isPublish ? new Date() : null,
      })
      .returning({ id: announcements.id });

    // A brand-new row published immediately is a FIRST-TIME publication →
    // notify all approved users (notification only, NO email). Auxiliary:
    // the emitter never throws, so publishing cannot fail because of it.
    if (isPublish) {
      await notifyApprovedUsers({
        type: "ANNOUNCEMENT",
        title: "New Announcement",
        message: `A new announcement has been published: "${parsed.data.title}"`,
        link: `/announcements/${row.id}`,
        entityType: "ANNOUNCEMENT",
        entityId: row.id,
      });
    }

    revalidateAnnouncementPaths();
    return { success: true, id: row.id };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Failed to create announcement." };
  }
}

/* -------------------------------- update ---------------------------------- */

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
  action: "save" | "publish" = "save",
): Promise<MutationResult> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized." };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false, error: "Invalid announcement id." };
    }

    const parsed = announcementSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed. Please check the title and content.",
      };
    }

    const [existing] = await db
      .select({
        status: announcements.status,
        publishedAt: announcements.publishedAt,
      })
      .from(announcements)
      .where(eq(announcements.id, parsedId.data))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Announcement not found." };
    }

    // "save" never changes the status (a draft stays a draft, a published
    // announcement stays published). "publish" moves the row to PUBLISHED
    // and stamps publishedAt only if it was never published before, so
    // restoring an archived announcement keeps its original date.
    const isPublish = action === "publish";

    await db
      .update(announcements)
      .set({
        title: parsed.data.title,
        content: parsed.data.content,
        status: isPublish ? "PUBLISHED" : existing.status,
        publishedAt: isPublish
          ? (existing.publishedAt ?? new Date())
          : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, parsedId.data));

    // Only a FIRST-TIME publication notifies (publishedAt was null before this
    // write). Editing an already-published announcement, or restoring an
    // archived one, never re-notifies — the (user_id, type, entity_id) unique
    // index enforces the same guarantee at the database level. NO email.
    if (isPublish && existing.publishedAt === null) {
      await notifyApprovedUsers({
        type: "ANNOUNCEMENT",
        title: "New Announcement",
        message: `A new announcement has been published: "${parsed.data.title}"`,
        link: `/announcements/${parsedId.data}`,
        entityType: "ANNOUNCEMENT",
        entityId: parsedId.data,
      });
    }

    revalidateAnnouncementPaths();
    return { success: true, id: parsedId.data };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Failed to update announcement." };
  }
}

/* -------------------------------- publish --------------------------------- */

export async function publishAnnouncement(
  id: string,
): Promise<MutationResult> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized." };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false, error: "Invalid announcement id." };
    }

    const [existing] = await db
      .select({
        title: announcements.title,
        publishedAt: announcements.publishedAt,
      })
      .from(announcements)
      .where(eq(announcements.id, parsedId.data))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Announcement not found." };
    }

    // Idempotent single-row update: PUBLISHED stays PUBLISHED, and the
    // original publishedAt is never overwritten (null only on first publish).
    await db
      .update(announcements)
      .set({
        status: "PUBLISHED",
        publishedAt: existing.publishedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, parsedId.data));

    // Notify only on the FIRST publication (publishedAt was null before this
    // write). Re-publishing an already-published announcement is a no-op, and
    // ARCHIVED → PUBLISHED (restore) intentionally does NOT re-notify: users
    // were already informed and the announcement resurfaces in /announcements.
    // The (user_id, type, entity_id) unique index enforces the same guarantee.
    // NO email.
    if (existing.publishedAt === null) {
      await notifyApprovedUsers({
        type: "ANNOUNCEMENT",
        title: "New Announcement",
        message: `A new announcement has been published: "${existing.title}"`,
        link: `/announcements/${parsedId.data}`,
        entityType: "ANNOUNCEMENT",
        entityId: parsedId.data,
      });
    }

    revalidateAnnouncementPaths();
    return { success: true, id: parsedId.data };
  } catch (error) {
    console.error("Error publishing announcement:", error);
    return { success: false, error: "Failed to publish announcement." };
  }
}

/* -------------------------------- archive --------------------------------- */

export async function archiveAnnouncement(
  id: string,
): Promise<MutationResult> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized." };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false, error: "Invalid announcement id." };
    }

    // publishedAt is intentionally preserved: the historical publication
    // date remains meaningful if the announcement is later restored.
    await db
      .update(announcements)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, parsedId.data));

    revalidateAnnouncementPaths();
    return { success: true, id: parsedId.data };
  } catch (error) {
    console.error("Error archiving announcement:", error);
    return { success: false, error: "Failed to archive announcement." };
  }
}

/* -------------------------------- delete ---------------------------------- */

export async function deleteAnnouncement(
  id: string,
): Promise<MutationResult> {
  try {
    if (!(await isAdminUser())) {
      return { success: false, error: "Not authorized." };
    }

    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false, error: "Invalid announcement id." };
    }

    // Announcements are text-only: no media cleanup is required. Deletion is
    // permanent — the UI always confirms before reaching this action.
    await db.delete(announcements).where(eq(announcements.id, parsedId.data));

    revalidateAnnouncementPaths();
    return { success: true, id: parsedId.data };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Failed to delete announcement." };
  }
}