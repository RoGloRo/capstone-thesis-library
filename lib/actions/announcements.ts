"use server";

/**
 * lib/actions/announcements.ts
 *
 * Public (user-facing) READ-ONLY announcement queries.
 *
 * SECURITY INVARIANT: every query in this module hard-filters on
 * status = "PUBLISHED". Drafts and archived announcements must NEVER be
 * reachable from the user-facing pages — these actions run for every
 * signed-in user, so there is no admin check to fall back on here.
 *
 * Read-only by design: no create/update/delete/publish actions exist in this
 * module. All mutations live in lib/admin/actions/announcements.ts behind
 * isAdminUser(). User input is limited to a search term (sanitized to a
 * parameterized ilike pattern) and pagination numbers (clamped).
 */

import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/database/drizzle";
import { announcements } from "@/database/schema";

const zUuid = z.string().uuid();
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/* ---------------------------------- types --------------------------------- */

export type PublishedAnnouncement = {
  id: string;
  title: string;
  content: string;
  publishedAt: string | null;
};

export interface ListPublishedAnnouncementsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export type ListPublishedAnnouncementsResponse = {
  success: boolean;
  data?: PublishedAnnouncement[];
  total?: number;
};

/* ----------------------------- list (public) ------------------------------ */

export async function listPublishedAnnouncements(
  params: ListPublishedAnnouncementsParams = {},
): Promise<ListPublishedAnnouncementsResponse> {
  try {
    const search = (params.search ?? "").trim().slice(0, 200);
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Math.floor(params.pageSize ?? 9)),
    );

    // PUBLISHED-only, unconditionally — drafts and archived announcements
    // are never visible to normal users.
    const conditions = [eq(announcements.status, "PUBLISHED")];

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

    const whereClause = and(...conditions);

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
        publishedAt: announcements.publishedAt,
      })
      .from(announcements)
      .where(whereClause)
      // Newest publications first. publishedAt is always set for PUBLISHED
      // rows; createdAt is a defensive tiebreaker so a null can never
      // produce an undefined ordering.
      .orderBy(
        desc(announcements.publishedAt),
        desc(announcements.createdAt),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      })),
      total,
    };
  } catch (error) {
    console.error("Error fetching published announcements:", error);
    return { success: false };
  }
}

/* ---------------------------- get by id (public) -------------------------- */

export async function getPublishedAnnouncement(
  id: string,
): Promise<{ success: boolean; announcement?: PublishedAnnouncement }> {
  try {
    const parsedId = zUuid.safeParse(id);
    if (!parsedId.success || parsedId.data === ZERO_UUID) {
      return { success: false };
    }

    const [row] = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        publishedAt: announcements.publishedAt,
      })
      .from(announcements)
      // PUBLISHED-only: draft/archived content is never exposed through the
      // public detail route, even with a valid id (no IDOR).
      .where(
        and(
          eq(announcements.id, parsedId.data),
          eq(announcements.status, "PUBLISHED"),
        ),
      )
      .limit(1);

    if (!row) {
      return { success: false };
    }

    return {
      success: true,
      announcement: {
        id: row.id,
        title: row.title,
        content: row.content,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      },
    };
  } catch (error) {
    console.error("Error fetching published announcement:", error);
    return { success: false };
  }
}