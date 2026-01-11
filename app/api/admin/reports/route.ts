import { NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { books, borrowRecords, users } from '@/database/schema';
import { and, eq, lt, gte, sql } from 'drizzle-orm';
import dayjs from 'dayjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = 'preview', reportType = 'borrowing', filters = {}, page = 1, pageSize = 25 } = body;

    const { startDate, endDate, status, category, userId, search } = filters;

    const start = startDate ? dayjs(startDate).startOf('day').toDate() : null;
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : null;

    if (action === 'preview') {
      const offset = (page - 1) * pageSize;

      if (reportType === 'borrowing') {
        // Join borrow_records, books, users
        const rows = await db
          .select({
            id: borrowRecords.id,
            bookTitle: books.title,
            userName: users.fullName,
            borrowDate: borrowRecords.borrowDate,
            dueDate: borrowRecords.dueDate,
            returnDate: borrowRecords.returnDate,
            status: borrowRecords.status,
          })
          .from(borrowRecords)
          .leftJoin(books, eq(borrowRecords.bookId, books.id))
          .leftJoin(users, eq(borrowRecords.userId, users.id))
          .where((qb) => {
            const clauses: any[] = [];
            if (start) clauses.push(gte(borrowRecords.borrowDate, start));
            if (end) clauses.push(lt(borrowRecords.borrowDate, dayjs(end).add(1, 'day').toDate()));
            if (status) clauses.push(eq(borrowRecords.status, status));
            if (userId) clauses.push(eq(borrowRecords.userId, userId));
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              clauses.push(sql`(LOWER(${books.title}) LIKE ${pattern} OR LOWER(${users.fullName}) LIKE ${pattern})`);
            }
            return clauses.length ? and(...clauses) : undefined;
          })
          .orderBy(borrowRecords.borrowDate)
          .limit(pageSize)
          .offset(offset);

        return NextResponse.json({ rows });
      }

      if (reportType === 'overdue') {
        const today = dayjs().startOf('day').toDate();
        const rows = await db
          .select({
            id: borrowRecords.id,
            bookTitle: books.title,
            userName: users.fullName,
            borrowDate: borrowRecords.borrowDate,
            dueDate: borrowRecords.dueDate,
            status: borrowRecords.status,
          })
          .from(borrowRecords)
          .leftJoin(books, eq(borrowRecords.bookId, books.id))
          .leftJoin(users, eq(borrowRecords.userId, users.id))
          .where((qb) => {
            const clauses: any[] = [];
            clauses.push(lt(borrowRecords.dueDate, today));
            clauses.push(sql`${borrowRecords}.status <> 'RETURNED'`);
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              clauses.push(sql`(LOWER(${books.title}) LIKE ${pattern} OR LOWER(${users.fullName}) LIKE ${pattern})`);
            }
            return and(...clauses);
          })
          .orderBy(borrowRecords.dueDate)
          .limit(pageSize)
          .offset(offset);

        return NextResponse.json({ rows });
      }

      if (reportType === 'inventory') {
        const rows = await db
          .select({
            id: books.id,
            title: books.title,
            totalCopies: books.totalCopies,
            availableCopies: books.availableCopies,
            controlNumber: books.controlNumber,
          })
          .from(books)
          .where((qb) => {
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              return sql`LOWER(${books.title}) LIKE ${pattern}`;
            }
            return undefined;
          })
          .orderBy(books.title)
          .limit(pageSize)
          .offset(offset);

        return NextResponse.json({ rows });
      }

      if (reportType === 'user_activity') {
        const rows = await db
          .select({
            userId: users.id,
            userName: users.fullName,
            borrowedCount: sql`COUNT(${borrowRecords.id})`,
          })
          .from(users)
          .leftJoin(borrowRecords, eq(borrowRecords.userId, users.id))
          .groupBy(users.id)
          .where((qb) => {
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              return sql`LOWER(${users.fullName}) LIKE ${pattern}`;
            }
            return undefined;
          })
          .orderBy(sql`COUNT(${borrowRecords.id}) DESC`)
          .limit(pageSize)
          .offset(offset);

        return NextResponse.json({ rows });
      }

      return NextResponse.json({ rows: [] });
    }

    if (action === 'csv') {
      // Fetch all matching rows (no pagination) and return CSV
      let csv = '';
      if (reportType === 'borrowing') {
        const rows = await db
          .select({
            id: borrowRecords.id,
            bookTitle: books.title,
            userName: users.fullName,
            borrowDate: borrowRecords.borrowDate,
            dueDate: borrowRecords.dueDate,
            returnDate: borrowRecords.returnDate,
            status: borrowRecords.status,
          })
          .from(borrowRecords)
          .leftJoin(books, eq(borrowRecords.bookId, books.id))
          .leftJoin(users, eq(borrowRecords.userId, users.id))
          .where((qb) => {
            const clauses: any[] = [];
            if (start) clauses.push(gte(borrowRecords.borrowDate, start));
            if (end) clauses.push(lt(borrowRecords.borrowDate, dayjs(end).add(1, 'day').toDate()));
            if (status) clauses.push(eq(borrowRecords.status, status));
            if (userId) clauses.push(eq(borrowRecords.userId, userId));
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              clauses.push(sql`(LOWER(${books.title}) LIKE ${pattern} OR LOWER(${users.fullName}) LIKE ${pattern})`);
            }
            return clauses.length ? and(...clauses) : undefined;
          })
          .orderBy(borrowRecords.borrowDate);

        csv += 'id,bookTitle,userName,borrowDate,dueDate,returnDate,status\n';
        for (const r of rows) {
          csv += `${r.id},"${(r.bookTitle||'').replace(/"/g,'""')}","${(r.userName||'').replace(/"/g,'""')}",${r.borrowDate ? new Date(r.borrowDate).toISOString() : ''},${r.dueDate ? new Date(r.dueDate).toISOString() : ''},${r.returnDate ? new Date(r.returnDate).toISOString() : ''},${r.status}\n`;
        }
      }

      if (reportType === 'overdue') {
        const today = dayjs().startOf('day').toDate();
        const rows = await db
          .select({
            id: borrowRecords.id,
            bookTitle: books.title,
            userName: users.fullName,
            borrowDate: borrowRecords.borrowDate,
            dueDate: borrowRecords.dueDate,
            status: borrowRecords.status,
          })
          .from(borrowRecords)
          .leftJoin(books, eq(borrowRecords.bookId, books.id))
          .leftJoin(users, eq(borrowRecords.userId, users.id))
          .where((qb) => {
            const clauses: any[] = [];
            clauses.push(lt(borrowRecords.dueDate, today));
            clauses.push(sql`${borrowRecords}.status <> 'RETURNED'`);
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              clauses.push(sql`(LOWER(${books.title}) LIKE ${pattern} OR LOWER(${users.fullName}) LIKE ${pattern})`);
            }
            return and(...clauses);
          })
          .orderBy(borrowRecords.dueDate);

        csv += 'id,bookTitle,userName,borrowDate,dueDate,status\n';
        for (const r of rows) {
          csv += `${r.id},"${(r.bookTitle||'').replace(/"/g,'""')}","${(r.userName||'').replace(/"/g,'""')}",${r.borrowDate ? new Date(r.borrowDate).toISOString() : ''},${r.dueDate ? new Date(r.dueDate).toISOString() : ''},${r.status}\n`;
        }
      }

      if (reportType === 'inventory') {
        const rows = await db
          .select({
            id: books.id,
            title: books.title,
            totalCopies: books.totalCopies,
            availableCopies: books.availableCopies,
            controlNumber: books.controlNumber,
          })
          .from(books)
          .where((qb) => {
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              return sql`LOWER(${books.title}) LIKE ${pattern}`;
            }
            return undefined;
          })
          .orderBy(books.title);

        csv += 'id,title,totalCopies,availableCopies,controlNumber\n';
        for (const r of rows) {
          csv += `${r.id},"${(r.title||'').replace(/"/g,'""')}",${r.totalCopies},${r.availableCopies},${r.controlNumber||''}\n`;
        }
      }

      if (reportType === 'user_activity') {
        const rows = await db
          .select({
            userId: users.id,
            userName: users.fullName,
            borrowedCount: sql`COUNT(${borrowRecords.id})`,
          })
          .from(users)
          .leftJoin(borrowRecords, eq(borrowRecords.userId, users.id))
          .groupBy(users.id)
          .where((qb) => {
            if (search && typeof search === 'string' && search.trim() !== '') {
              const pattern = `%${search.trim().toLowerCase()}%`;
              return sql`LOWER(${users.fullName}) LIKE ${pattern}`;
            }
            return undefined;
          })
          .orderBy(sql`COUNT(${borrowRecords.id}) DESC`);

        csv += 'userId,userName,borrowedCount\n';
        for (const r of rows) {
          csv += `${r.userId},"${(r.userName||'').replace(/"/g,'""')}",${r.borrowedCount}\n`;
        }
      }

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'unsupported action' }, { status: 400 });
  } catch (err) {
    console.error('Report API error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
