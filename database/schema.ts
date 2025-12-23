
import { integer, text, boolean, pgTable, uuid, varchar, pgEnum, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const STATUS_ENUM = pgEnum("status", ["PENDING", "APPROVED", "REJECTED"]);
export const ROLE_ENUM = pgEnum("role", ["USER", "ADMIN"]);
export const BORROW_STATUS_ENUM = pgEnum("borrow_status", ["BORROWED", "STATUS"]);
export const EMAIL_TYPE_ENUM = pgEnum("email_type", [
  "WELCOME",
  "ACCOUNT_APPROVAL", 
  "ACCOUNT_REJECTION",
  "BORROW_CONFIRMATION",
  "DUE_REMINDER",
  "OVERDUE_NOTICE",
  "RETURN_CONFIRMATION",
  "USER_ACTIVE",
  "USER_INACTIVE",
  "DUE_TODAY",
  "PENALTY_NOTICE"
]);
export const EMAIL_STATUS_ENUM = pgEnum("email_status", ["SENT", "FAILED", "PENDING"]);

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", {length: 255}).notNull(),
  email: text("email").notNull().unique(),
  universityId: integer("univeristy_id").notNull().unique(),
  password: text("password").notNull(),
  universityCard: text("university_card").notNull(),
  status: STATUS_ENUM("status").default("PENDING"),
  role: ROLE_ENUM("role").default("USER"),
  lastActivityDate: date("last_activity_date").defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
});

export const books = pgTable("books", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  genre: text("genre").notNull(),
  rating: integer("rating").notNull(),
  coverUrl: text("cover_url").notNull(),
  coverColor: varchar("cover_color", { length: 7 }).notNull(),
  description: text("description").notNull(),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(0),
  videoUrl: text("video_url").notNull(),
  summary: varchar("summary", { length: 1000 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const borrowRecords = pgTable("borrow_records", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  borrowDate: timestamp("borrow_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: BORROW_STATUS_ENUM("status").default("BORROWED").notNull(),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  emailType: EMAIL_TYPE_ENUM("email_type").notNull(),
  status: EMAIL_STATUS_ENUM("status").default("SENT").notNull(),
  subject: text("subject").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
  metadata: text("metadata"), // JSON string for additional data
});
