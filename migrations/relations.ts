import { relations } from "drizzle-orm/relations";
import { users, borrowRecords, books } from "./schema";

export const borrowRecordsRelations = relations(borrowRecords, ({one}) => ({
	user: one(users, {
		fields: [borrowRecords.userId],
		references: [users.id]
	}),
	book: one(books, {
		fields: [borrowRecords.bookId],
		references: [books.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	borrowRecords: many(borrowRecords),
}));

export const booksRelations = relations(books, ({many}) => ({
	borrowRecords: many(borrowRecords),
}));