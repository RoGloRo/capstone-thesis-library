import { db } from "@/database/drizzle";
import { books, users, borrowRecords } from "@/database/schema";
import { and, gte, eq, sql, desc } from "drizzle-orm";

// The Philippines uses PHT (UTC+8) year-round with no DST. We treat "today"
// as the calendar day in Asia/Manila regardless of the Neon session timezone
// (UTC). All user-facing daily aggregations (Borrowed Today, trends buckets,
// overdue threshold) anchor to this Manila calendar day so dates cannot shift.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Shift any Date into the Manila calendar (same instant viewed at +8h). */
function toManilaInstant(date: Date): Date {
  return new Date(date.getTime() + MANILA_OFFSET_MS);
}

/** Absolute instant of Manila calendar day 00:00:00.000. */
export function manilaTodayStart(): Date {
  const shifted = toManilaInstant(new Date());
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  );
}

/** Absolute instant of the next Manila calendar day 00:00:00 (exclusive upper bound). */
export function manilaTomorrowStart(): Date {
  return new Date(manilaTodayStart().getTime() + 24 * 60 * 60 * 1000);
}

/** Format any Date as its Asia/Manila calendar `YYYY-MM-DD` string. */
export function manilaDateStr(date: Date): string {
  const shifted = toManilaInstant(date);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's Manila calendar date, e.g. "2026-08-29". */
export function manilaTodayStr(): string {
  return manilaDateStr(new Date());
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Short month label like "Aug'26" for a Date interpreted at UTC midnight. */
function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getUTCMonth()]}'${String(date.getUTCFullYear()).slice(-2)}`;
}

/** "yyyy-MM" bucket key for a Date interpreted at UTC midnight. */
function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type DerivedLoanStatus = "Active" | "Returned" | "Overdue";

/** Derive a human-friendly loan status from stored dates (never raw enum). */
export function deriveLoanStatus(
  returnDate: string | Date | null | undefined,
  dueDate: string | Date | null | undefined,
  manilaToday?: string
): DerivedLoanStatus {
  if (returnDate) return "Returned";
  if (!dueDate) return "Active";
  const dueStr =
    dueDate instanceof Date
      ? manilaDateStr(dueDate)
      : manilaDateStr(new Date(`${dueDate}T00:00:00`));
  const today = manilaToday ?? manilaTodayStr();
  return dueStr < today ? "Overdue" : "Active";
}

export async function getAdminDashboardStats() {
  const todayStart = manilaTodayStart();
  const tomorrowStart = manilaTomorrowStart();
  const manilaToday = manilaTodayStr();

  const [bookStats, userStats, borrowStats] = await Promise.all([
    // Physical copies + distinct titles.
    db
      .select({
        totalCopies: sql<number>`COALESCE(SUM(${books.totalCopies}), 0)`,
        availableCopies: sql<number>`COALESCE(SUM(${books.availableCopies}), 0)`,
        titleCount: sql<number>`COUNT(*)`,
      })
      .from(books),
    // Registered users: approved (main) + totals for subtext.
    db
      .select({
        approvedUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'APPROVED'::status)`,
        pendingUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'PENDING'::status)`,
        rejectedUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'REJECTED'::status)`,
        totalUsers: sql<number>`COUNT(*)`,
      })
      .from(users),
    // All borrow-derived KPIs in one aggregate pass.
    db
      .select({
        borrowedToday: sql<number>`COUNT(*) FILTER (WHERE ${borrowRecords.borrowDate} >= ${todayStart} AND ${borrowRecords.borrowDate} < ${tomorrowStart})`,
        currentlyBorrowed: sql<number>`COUNT(*) FILTER (WHERE ${borrowRecords.status} = 'BORROWED'::borrow_status)`,
        overdue: sql<number>`COUNT(*) FILTER (WHERE ${borrowRecords.status} = 'BORROWED'::borrow_status AND ${borrowRecords.dueDate}::text < ${manilaToday})`,
        totalReturned: sql<number>`COUNT(*) FILTER (WHERE ${borrowRecords.returnDate} IS NOT NULL)`,
      })
      .from(borrowRecords),
  ]);

  return {
    totalBooks: Number(bookStats[0]?.totalCopies ?? 0),
    availableBooks: Number(bookStats[0]?.availableCopies ?? 0),
    titleCount: Number(bookStats[0]?.titleCount ?? 0),
    totalUsers: Number(userStats[0]?.approvedUsers ?? 0),
    totalAccounts: Number(userStats[0]?.totalUsers ?? 0),
    pendingUsers: Number(userStats[0]?.pendingUsers ?? 0),
    rejectedUsers: Number(userStats[0]?.rejectedUsers ?? 0),
    borrowedToday: Number(borrowStats[0]?.borrowedToday ?? 0),
    currentlyBorrowed: Number(borrowStats[0]?.currentlyBorrowed ?? 0),
    overdueBooks: Number(borrowStats[0]?.overdue ?? 0),
    returnedBooks: Number(borrowStats[0]?.totalReturned ?? 0),
  };
}

export async function getBorrowingTrends() {
  // Granularity from actual borrow history span: ≤ 60 days → daily buckets
  // (last 30 days); otherwise monthly (last 12 calendar months).
  const [minSpan, maxSpan] = await Promise.all([
    db.select({ value: sql<string | null>`MIN(${borrowRecords.borrowDate})` }).from(borrowRecords),
    db.select({ value: sql<string | null>`MAX(${borrowRecords.borrowDate})` }).from(borrowRecords),
  ]);

  const minDate = minSpan[0]?.value ? new Date(minSpan[0].value) : null;
  const maxDate = maxSpan[0]?.value ? new Date(maxSpan[0].value) : null;

  if (!minDate || !maxDate) {
    return { data: [], granularity: "daily" as const, hasData: false };
  }

  const spanDays = (maxDate.getTime() - minDate.getTime()) / 86_400_000;
  const isMonthly = spanDays > 60;
  const todayStart = manilaTodayStart();

  let windowStart: Date;
  if (isMonthly) {
    // Manila midnight of the 1st day of the month 11 months back.
    windowStart = new Date(
      Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() - 11, 1) -
        MANILA_OFFSET_MS
    );
  } else {
    // Manila midnight of the day 29 days back.
    windowStart = new Date(
      Date.UTC(
        todayStart.getUTCFullYear(),
        todayStart.getUTCMonth(),
        todayStart.getUTCDate() - 29
      ) - MANILA_OFFSET_MS
    );
  }

  // Borrow events bucketed in Manila-local calendar units. Buckets are emitted
  // as "YYYY-MM" (monthly) or "YYYY-MM-DD" (daily) strings.
  const borrowKeyExpr = isMonthly
    ? sql<string>`to_char(date_trunc('month', ${borrowRecords.borrowDate} AT TIME ZONE 'Asia/Manila'), 'YYYY-MM')`
    : sql<string>`to_char(date_trunc('day', ${borrowRecords.borrowDate} AT TIME ZONE 'Asia/Manila'), 'YYYY-MM-DD')`;

  const bucketedBorrows = await db
    .select({
      bucket: borrowKeyExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(borrowRecords)
    .where(gte(borrowRecords.borrowDate, windowStart))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  // Return events: return_date is a plain calendar date (no timezone stored),
  // bucketed directly by that calendar day / month.
  const returnKeyExpr = isMonthly
    ? sql<string>`to_char(date_trunc('month', ${borrowRecords.returnDate}), 'YYYY-MM')`
    : sql<string>`to_char(${borrowRecords.returnDate}, 'YYYY-MM-DD')`;

  const bucketedReturns = await db
    .select({
      bucket: returnKeyExpr,
      count: sql<number>`COUNT(*)`,
    })
    .from(borrowRecords)
    .where(
      and(
        sql`${borrowRecords.returnDate} IS NOT NULL`,
        sql`${borrowRecords.returnDate}::text >= ${manilaDateStr(windowStart)}`
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const borrowMap = new Map(
    bucketedBorrows.map((r) => [r.bucket, Number(r.count) || 0])
  );
  const returnMap = new Map(
    bucketedReturns.map((r) => [r.bucket, Number(r.count) || 0])
  );

  // Build the zero-filled, chronologically ORDERED series (a missing bucket is
  // rendered as 0 rather than a gap; ordering is explicit).
  const buckets: { key: string; label: string }[] = [];
  if (isMonthly) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(
        Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() - i, 1)
      );
      buckets.push({
        key: monthKey(d),
        label: monthLabel(d),
      });
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86_400_000);
      buckets.push({
        key: manilaDateStr(d),
        label: manilaDateStr(d).slice(5), // "MM-DD"
      });
    }
  }

  const data = buckets.map((b) => ({
    date: b.label,
    borrowed: borrowMap.get(b.key) ?? 0,
    returned: returnMap.get(b.key) ?? 0,
  }));

  const totalBorrowedInWindow = data.reduce((s, d) => s + d.borrowed, 0);
  const hasData = totalBorrowedInWindow > 0 || data.some((d) => d.returned > 0);

  return {
    data,
    granularity: isMonthly ? ("monthly" as const) : ("daily" as const),
    hasData,
  };
}

/**
 * Top genres by number of borrow TRANSACTIONS, not catalogue title counts
 * (matches the AI insights route definition). Returns the top `limit` genres
 * plus an "Other" bucket that preserves the full sum of every remaining
 * genre's borrows.
 */
export async function getTopGenres(limit = 8) {
  const raw = await db
    .select({
      genre: books.genre,
      count: sql<number>`count(${borrowRecords.id})`,
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .where(sql`${books.genre} IS NOT NULL AND ${books.genre} != ''`)
    .groupBy(books.genre)
    .orderBy(sql`count(${borrowRecords.id}) DESC, ${books.genre} ASC`);

  if (raw.length === 0) return { genres: [], total: 0 };

  const total = raw.reduce((s, g) => s + Number(g.count || 0), 0);
  const genres = raw.slice(0, limit).map((g) => ({
    genre: g.genre || "Unknown",
    count: Number(g.count || 0),
  }));

  if (raw.length > limit) {
    const rest = raw.slice(limit).reduce((s, g) => s + Number(g.count || 0), 0);
    if (rest > 0) {
      genres.push({ genre: "Other", count: rest });
    }
  }

  return { genres, total };
}

export async function getRecentlyBorrowedBooks() {
  const recentBorrows = await db
    .select({
      id: borrowRecords.id,
      bookTitle: books.title,
      bookAuthor: books.author,
      borrowerName: users.fullName,
      borrowerEmail: users.email,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      returnDate: borrowRecords.returnDate,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(users, eq(borrowRecords.userId, users.id))
    .orderBy(desc(borrowRecords.borrowDate))
    .limit(10);

  const manilaToday = manilaTodayStr();
  return recentBorrows.map((record) => ({
    id: record.id,
    bookTitle: record.bookTitle,
    bookAuthor: record.bookAuthor,
    borrowerName: record.borrowerName,
    borrowerEmail: record.borrowerEmail,
    borrowDate: new Date(record.borrowDate),
    dueDate: String(record.dueDate ?? ""),
    returnDate: record.returnDate ? String(record.returnDate) : null,
    // Derived human-friendly status — never the raw BORROWED/STATUS enum.
    derivedStatus: deriveLoanStatus(record.returnDate, record.dueDate, manilaToday),
  }));
}

export async function getRecentlyReturnedBooks() {
  const recentReturns = await db
    .select({
      id: borrowRecords.id,
      bookTitle: books.title,
      borrowerName: users.fullName,
      returnDate: borrowRecords.returnDate,
      borrowDate: borrowRecords.borrowDate,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(users, eq(borrowRecords.userId, users.id))
    .where(sql`${borrowRecords.returnDate} IS NOT NULL`)
    .orderBy(desc(borrowRecords.returnDate))
    .limit(10);

  return recentReturns.map((record) => ({
    id: record.id,
    bookTitle: record.bookTitle,
    borrowerName: record.borrowerName,
    returnDate: record.returnDate ? String(record.returnDate) : null,
    borrowDate: new Date(record.borrowDate),
    derivedStatus: "Returned" as const,
  }));
}

export async function getOverdueBooks() {
  const manilaToday = manilaTodayStr();

  const overdueBooks = await db
    .select({
      id: borrowRecords.id,
      bookTitle: books.title,
      borrowerName: users.fullName,
      borrowerEmail: users.email,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      // daysOverdue computed in SQL against the Manila calendar "today", so
      // the KPI and the table always agree. `::date` cast on the parameter
      // (Postgres rejects the `DATE 'literal'` form for bound params).
      daysOverdue: sql<number>`(${manilaToday}::date - ${borrowRecords.dueDate})`,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(users, eq(borrowRecords.userId, users.id))
    .where(
      and(
        sql`${borrowRecords.status} = 'BORROWED'::borrow_status`,
        sql`${borrowRecords.dueDate}::text < ${manilaToday}`
      )
    )
    .orderBy(borrowRecords.dueDate);

  return overdueBooks.map((record) => ({
    ...record,
    borrowDate: new Date(record.borrowDate),
    daysOverdue: Number(record.daysOverdue ?? 0),
  }));
}

/**
 * Top books by lifetime borrow TRANSACTIONS (returned books still count; a
 * re-borrow of the same title counts again). Sorted by borrow count DESC,
 * title ASC for deterministic ties. Up to `limit` books.
 */
export async function getTopBooks(limit = 8) {
  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      borrowCount: sql<number>`count(${borrowRecords.id})`,
    })
    .from(borrowRecords)
    .innerJoin(books, eq(borrowRecords.bookId, books.id))
    .groupBy(books.id, books.title, books.author)
    .orderBy(sql`count(${borrowRecords.id}) DESC, ${books.title} ASC`)
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author ?? "",
    borrowCount: Number(row.borrowCount || 0),
  }));
}

export async function getTopBorrowers() {
  const topBorrowers = await db
    .select({
      id: users.id,
      name: users.fullName,
      email: users.email,
      borrowCount: sql<number>`count(${borrowRecords.id})`,
    })
    .from(users)
    .leftJoin(borrowRecords, eq(users.id, borrowRecords.userId))
    .where(sql`${users.status} = 'APPROVED'::status`)
    .groupBy(users.id, users.fullName, users.email)
    .having(sql`count(${borrowRecords.id}) > 0`)
    .orderBy(sql`count(${borrowRecords.id}) DESC`)
    .limit(5);

  return topBorrowers.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    borrowCount: Number(b.borrowCount || 0),
  }));
}