import { z } from "zod";


export const signUpSchema = z.object ({
  fullName: z.string().min(3),
  email: z.string().email(),
  universityId: z
    .string()
    .trim()
    .min(1, "School ID is required")
    .max(50, "School ID must be 50 characters or fewer"),
  universityCard: z.string().nonempty("School ID Picture is required"),
  password: z.string().min(8),
  userCategory: z.enum(["STUDENT", "TEACHER", "STAFF"], {
    message: "User Category is required.",
  }),
  gradeLevel: z
    .union([
      z.enum(
        [
          "GRADE_7",
          "GRADE_8",
          "GRADE_9",
          "GRADE_10",
          "GRADE_11",
          "GRADE_12",
        ],
        {
          message: "Grade Level is required for students.",
        }
      ),
      z.literal(""), // Hidden/cleared for non-students; normalized to null below.
    ])
    .nullable()
    .optional()
    .transform((v) => (v == null || v === "" ? null : v)),
}).superRefine((data, ctx) => {
  if (data.userCategory === "STUDENT" && !data.gradeLevel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grade Level is required for students.",
      path: ["gradeLevel"],
    });
  }
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const bookSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(1000),
  author: z.string().trim().min(2).max(100),
  genre: z.string().trim().min(2).max(50),
  rating: z.coerce.number().min(1).max(5),
  totalCopies: z.coerce.number().int().positive().lte(10000),
  coverUrl: z.string().nonempty(),
  coverColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-F]{6}$/i),
  videoUrl: z.string().nonempty(),
  summary: z.string().trim().min(10),
  controlNumber: z.string().trim().max(64).optional(),
  publishedYear: z
    .union([
      z.number().int().min(1000).max(new Date().getFullYear()),
      z.null(),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  identifier: z
    .union([z.string().trim().max(200), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  publisher: z
    .union([z.string().trim().max(255), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  edition: z
    .union([z.string().trim().max(255), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  language: z
    .union([z.string().trim().max(100), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  pages: z
    .union([z.number().int().positive(), z.null(), z.literal("")])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  shelfLocation: z
    .union([z.string().trim().max(100), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  bookFormat: z
    .union([z.string().trim().max(50), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
  acquisitionDate: z
    .union([z.string().trim(), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? undefined : v)),
});

// Contact Us / feedback message submitted from the public About page.
// Used BOTH by the client form (instant feedback) and re-validated on the
// server inside submitContactMessage — single source of truth, no drift.
export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("Please enter a valid email address.")
    .max(254, "Email must be 254 characters or fewer."),
  message: z
    .string()
    .trim()
    .min(1, "Please enter a message.")
    .max(5000, "Message must be 5000 characters or fewer."),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const MESSAGE_STATUSES = ["UNREAD", "READ", "RESOLVED"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

// Announcements — text-only news/notice posts managed by admins/librarians.
// Used BOTH by the client form (instant feedback) and re-validated on the
// server inside the announcement server actions — single source of truth,
// no drift. Trim + required so whitespace-only values are rejected.
export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Please enter a title.")
    .max(200, "Title must be 200 characters or fewer."),
  content: z
    .string()
    .trim()
    .min(1, "Please enter the announcement content.")
    .max(5000, "Content must be 5000 characters or fewer."),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const ANNOUNCEMENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];