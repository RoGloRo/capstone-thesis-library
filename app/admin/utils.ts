import { db } from "@/database/drizzle";
import { books, users, borrowRecords } from "@/database/schema";
import { and, gte, lte, eq, sql, or, desc, count } from "drizzle-orm";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getAdminDashboardStats() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    totalBooks,
    totalUsers,
    borrowedToday,
    currentlyBorrowed,
    overdueBooks,
    returnedBooks
  ] = await Promise.all([
    // Total Books
    db.select({ count: sql<number>`count(*)` }).from(books),
    
    // Total Users
    db.select({ count: sql<number>`count(*)` }).from(users),
    
    // Borrowed Today
    db
      .select({ count: sql<number>`count(*)` })
      .from(borrowRecords)
      .where(
        and(
          gte(borrowRecords.borrowDate, todayStart),
          lte(borrowRecords.borrowDate, todayEnd),
          sql`${borrowRecords.status} = 'BORROWED'::borrow_status`
        )
      ),
    
    // Currently Borrowed
    db
      .select({ count: sql<number>`count(*)` })
      .from(borrowRecords)
      .where(sql`${borrowRecords.status} = 'BORROWED'::borrow_status`),
    
    // Overdue Books (borrowed books past due date only, since OVERDUE enum doesn't exist)
    db
      .select({ count: sql<number>`count(*)` })
      .from(borrowRecords)
      .where(
        sql`${borrowRecords.status} = 'BORROWED'::borrow_status AND ${borrowRecords.dueDate} <= CURRENT_DATE`
      ),
    
    // Returned Books (check for return_date being set, since RETURNED enum doesn't exist)
    db
      .select({ count: sql<number>`count(*)` })
      .from(borrowRecords)
      .where(sql`${borrowRecords.returnDate} IS NOT NULL`)
  ]);

  return {
    totalBooks: totalBooks[0]?.count || 0,
    totalUsers: totalUsers[0]?.count || 0,
    borrowedToday: borrowedToday[0]?.count || 0,
    currentlyBorrowed: currentlyBorrowed[0]?.count || 0,
    overdueBooks: overdueBooks[0]?.count || 0,
    returnedBooks: returnedBooks[0]?.count || 0,
  };
}

export async function getBorrowingTrends() {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      date: format(date, 'MMM dd'),
      fullDate: date,
    };
  }).reverse();

  const trends = await Promise.all(
    last7Days.map(async (day) => {
      const dayStart = startOfDay(day.fullDate);
      const dayEnd = endOfDay(day.fullDate);

      const [borrowed, returned] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(borrowRecords)
          .where(
            and(
              gte(borrowRecords.borrowDate, dayStart),
              lte(borrowRecords.borrowDate, dayEnd),
              sql`${borrowRecords.status} = 'BORROWED'::borrow_status`
            )
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(borrowRecords)
          .where(
            and(
              sql`${borrowRecords.returnDate} >= ${dayStart.toISOString().split('T')[0]}`,
              sql`${borrowRecords.returnDate} <= ${dayEnd.toISOString().split('T')[0]}`
            )
          ),
      ]);

      return {
        date: day.date,
        borrowed: borrowed[0]?.count || 0,
        returned: returned[0]?.count || 0,
      };
    })
  );

  return trends;
}

export async function getTopGenres() {
  const genres = await db
    .select({
      genre: books.genre,
      count: sql<number>`count(*)`,
    })
    .from(books)
    .where(sql`${books.genre} IS NOT NULL AND ${books.genre} != ''`)
    .groupBy(books.genre)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  // Transform the data to ensure proper format for the chart
  return genres.map(genre => ({
    genre: genre.genre || 'Unknown',
    count: Number(genre.count) || 0,
  }));
}

export async function getRecentlyBorrowedBooks() {
  const recentBorrows = await db
    .select({
      id: borrowRecords.id,
      bookTitle: books.title,
      borrowerName: users.fullName,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
      status: borrowRecords.status,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(users, eq(borrowRecords.userId, users.id))
    .where(sql`${borrowRecords.status} = 'BORROWED'::borrow_status`)
    .orderBy(desc(borrowRecords.borrowDate))
    .limit(10);

  return recentBorrows.map(record => ({
    ...record,
    borrowDate: new Date(record.borrowDate),
  }));
}

export async function getOverdueBooks() {
  const today = new Date().toISOString().split('T')[0];
  
  const overdueBooks = await db
    .select({
      id: borrowRecords.id,
      bookTitle: books.title,
      borrowerName: users.fullName,
      borrowDate: borrowRecords.borrowDate,
      dueDate: borrowRecords.dueDate,
    })
    .from(borrowRecords)
    .leftJoin(books, eq(borrowRecords.bookId, books.id))
    .leftJoin(users, eq(borrowRecords.userId, users.id))
    .where(
      and(
        sql`${borrowRecords.status} = 'BORROWED'::borrow_status`,
        sql`${borrowRecords.dueDate} < ${today}`
      )
    )
    .orderBy(borrowRecords.dueDate);

  return overdueBooks.map(record => {
    const dueDate = new Date(record.dueDate);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...record,
      borrowDate: new Date(record.borrowDate),
      daysOverdue,
    };
  });
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
    .groupBy(users.id, users.fullName, users.email)
    .orderBy(sql`count(${borrowRecords.id}) DESC`)
    .limit(5);

  return topBorrowers;
}