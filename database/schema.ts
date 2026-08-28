
import { integer, text, boolean, pgTable, uuid, varchar, pgEnum, date, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

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
export const MESSAGE_STATUS_ENUM = pgEnum("message_status", [
  "UNREAD",
  "READ",
  "RESOLVED",
]);

// Admin Notification Center categories. "ALL" is intentionally NOT a database
// value — it only exists as a UI filter on the page.
export const NOTIFICATION_CATEGORY_ENUM = pgEnum("notification_category", [
  "BOOK",
  "ACCOUNT",
  "MESSAGE",
  "SYSTEM",
]);

// Only event types backed by real existing functionality. The SYSTEM category
// is reserved/future-ready and currently produces no events.
export const NOTIFICATION_TYPE_ENUM = pgEnum("notification_type", [
  "BOOK_BORROWED",
  "BOOK_RETURNED",
  "BOOK_DUE_SOON",
  "BOOK_OVERDUE",
  "ACCOUNT_REQUEST",
  "ACCOUNT_APPROVED",
  "ACCOUNT_REJECTED",
  "NEW_MESSAGE",
]);

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", {length: 255}).notNull(),
  email: text("email").notNull().unique(),
  universityId: varchar("univeristy_id", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  universityCard: text("university_card").notNull(),
  status: STATUS_ENUM("status").default("PENDING"),
  role: ROLE_ENUM("role").default("USER"),
  userCategory: varchar("user_category", { length: 20 }),
  gradeLevel: varchar("grade_level", { length: 20 }),
  lastActivityDate: date("last_activity_date").defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
  preferredGenres: text("preferred_genres"), // JSON array of genre strings
  onboardingCompleted: boolean("onboarding_completed").default(false),
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
  controlNumber: varchar("control_number", { length: 32 }),
  publishedYear: integer("published_year"),
  identifier: varchar("identifier", { length: 200 }),
  publisher: varchar("publisher", { length: 255 }),
  edition: varchar("edition", { length: 255 }),
  language: varchar("language", { length: 100 }),
  pages: integer("pages"),
  shelfLocation: varchar("shelf_location", { length: 100 }),
  bookFormat: varchar("book_format", { length: 50 }),
  acquisitionDate: date("acquisition_date"),
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

export const savedBooks = pgTable("saved_books", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userBookUnique: uniqueIndex("saved_books_user_book_unique").on(table.userId, table.bookId),
  userIdx: index("saved_books_user_idx").on(table.userId),
}));

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

export const visitLogs = pgTable("visit_logs", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  visitDate: date("visit_date").notNull(),
  visitTime: varchar("visit_time", { length: 10 }).notNull(), // e.g. "09:12 AM"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx: index("visit_logs_user_idx").on(table.userId),
  visitDateIdx: index("visit_logs_date_idx").on(table.visitDate),
}));

// Contact/feedback messages submitted through the public "Contact Us" / "Send
// Us a Message" form.
//
// Design notes:
// - userId is NULLABLE and uses ON DELETE SET NULL so a submitted message is
//   preserved even if the linked user account is later deleted.
// - Only the userId relates the message to an account. name/email/message are
//   the first-class values actually submitted through the form and are stored
//   independently of any auth state — guests submit with userId = NULL, and the
//   name/email are still kept.
// - `status` is a closed-set workflow state (UNREAD / READ / RESOLVED), so it
//   uses a pgEnum just like users.status / borrowRecords.status.
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  message: text("message").notNull(),
  status: MESSAGE_STATUS_ENUM("status").default("UNREAD").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
  // The dominant admin query filters by status (and then sorts by createdAt).
  statusIdx: index("contact_messages_status_idx").on(table.status),
}));

// Admin Notification Center — a centralized, event/activity layer for
// important library events that require an admin's awareness (NOT an email-log
// viewer, and NOT an audit log of every user action).
//
// Design notes:
// - userId is NULLABLE and uses ON DELETE SET NULL so a historical notification
//   is preserved even if the linked account is later deleted.
// - entityType + entityId are a NULLABLE generic pointer used by the admin UI to
//   navigate toward the related record. They are NOT FKs (the target record may
//   not always exist or map 1:1), just discriminator + UUID reference.
// - Dedup: a unique index over (type, entity_type, entity_id) guarantees a
//   single notification per business event (e.g. one BOOK_RETURNED per borrow
//   record). Inserts use ON CONFLICT DO NOTHING so repeated/re-run workflows
//   never create duplicates. This is intentionally independent of email_logs.
// - createdAt uses timestamptz, matching the rest of the schema.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    category: NOTIFICATION_CATEGORY_ENUM("category").notNull(),
    type: NOTIFICATION_TYPE_ENUM("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // One notification per (type, entity) — deduplication for idempotent flows.
    dedupIdx: uniqueIndex("notifications_dedup_idx").on(
      table.type,
      table.entityType,
      table.entityId,
    ),
    categoryIdx: index("notifications_category_idx").on(table.category),
    readIdx: index("notifications_is_read_idx").on(table.isRead),
    createdIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

// Announcements — a text-only news/notice feed for the library managed by
// admins/librarians and read by all users.
//
// Design notes:
// - TEXT ONLY for now (title + content). No media columns, no storage provider,
//   no audience targeting: every announcement is intended for everyone.
// - Lifecycle: DRAFT -> PUBLISHED -> ARCHIVED, with ARCHIVED restore-able via
//   publish. When a DRAFT is published, published_at is stamped. Re-publishing
//   an archived/published announcement NEVER overwrites the original
//   published_at so the historical publication date is always preserved.
// - Only PUBLISHED rows are ever exposed to normal users; drafts and archived
//   announcements are admin-facing only.
// - status / published_at / created_at follow the closed-set pgEnum + timestamptz
//   conventions used by the rest of the schema. created_at defaults to now()
//   (no ON UPDATE trigger — updated_at is managed by the server actions), and
//   both timestamps use withTimezone like contact_messages / notifications.
export const ANNOUNCEMENT_STATUS_ENUM = pgEnum("announcement_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    status: ANNOUNCEMENT_STATUS_ENUM("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // The dominant admin query filters by status (then sorts by createdAt). The
    // user-facing feed filters by status and sorts by publishedAt.
    statusIdx: index("announcements_status_idx").on(table.status),
    publishedAtIdx: index("announcements_published_at_idx").on(table.publishedAt),
    createdAtIdx: index("announcements_created_at_idx").on(table.createdAt),
  }),
);

// User Notification Center — the per-user inbox that powers the header bell
// and the /notifications page. Deliberately SEPARATE from the admin
// `notifications` activity feed (different audience, wording and — critically —
// read-state ownership).
//
// Design notes:
// - One row per recipient (fan-out). user_id is NOT NULL with ON DELETE
//   CASCADE: an inbox row is personal, so it is meaningless without its user
//   (unlike the admin feed, which preserves history with ON DELETE SET NULL).
// - `link` is a server-generated INTERNAL route (e.g. /announcements/{uuid},
//   /books/{uuid}) — never user-supplied and never an external URL.
// - Dedup: a unique index over (user_id, type, entity_id) guarantees each user
//   is notified at most ONCE per business event (e.g. a re-published or
//   restored announcement never re-notifies). Inserts use ON CONFLICT DO
//   NOTHING so repeated admin actions stay idempotent.
export const USER_NOTIFICATION_TYPE_ENUM = pgEnum("user_notification_type", [
  "ANNOUNCEMENT",
  "NEW_BOOK",
]);

export const userNotifications = pgTable(
  "user_notifications",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: USER_NOTIFICATION_TYPE_ENUM("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    link: varchar("link", { length: 500 }),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Once per user per event — deduplication for idempotent admin actions.
    dedupIdx: uniqueIndex("user_notifications_dedup_idx").on(
      table.userId,
      table.type,
      table.entityId,
    ),
    // Inbox list query (filter by user, newest first).
    userCreatedIdx: index("user_notifications_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    // Unread badge count query.
    userUnreadIdx: index("user_notifications_user_unread_idx").on(
      table.userId,
      table.isRead,
    ),
  }),
);
