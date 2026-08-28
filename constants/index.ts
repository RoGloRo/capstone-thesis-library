export const navigationLinks = [
  {
    href: "/library",
    label: "Library",
  },

  {
    img: "/icons/user.svg",
    selectedImg: "/icons/user-fill.svg",
    href: "/my-profile",
    label: "My Profile",
  },
];

export const adminSideBarLinks = [
  {
    img: "/icons/admin/home.svg",
    route: "/admin",
    text: "Home",
  },
  {
    img: "/icons/admin/notification.svg",
    route: "/admin/notifications",
    text: "Notifications",
  },
  {
    img: "/icons/admin/mail.svg",
    route: "/admin/email-logs",
    text: "Email Logs",
  },
  {
    img: "/icons/admin/users.svg",
    route: "/admin/users",
    text: "All Users",
  },
  {
    img: "/icons/admin/book.svg",
    route: "/admin/books",
    text: "All Books",
  },
  {
    img: "/icons/admin/bookmark.svg",
    route: "/admin/borrow-records",
    text: "Borrow Records",
  },
  {
    img: "/icons/admin/receipt.svg",
    route: "/admin/reports",
    text: "Reports",
  },
  {
    img: "/icons/admin/info.svg",
    route: "/admin/messages",
    text: "Messages",
  },
  {
    img: "/icons/admin/user.svg",
    route: "/admin/account-requests",
    text: "Account Requests",
  },
  {
    img: "/icons/admin/calendar.svg",
    route: "/admin/visit-logs",
    text: "Visit Logs",
  },
  
];

export const FIELD_NAMES = {
  fullName: "Full name",
  email: "Email",
  universityId: "School ID",
  password: "Password",
  universityCard: "Upload School ID Picture",
  userCategory: "User Category",
  gradeLevel: "Grade Level",
};

export const FIELD_TYPES = {
  fullName: "text",
  email: "email",
  universityId: "text",
  password: "password",
};

export const sampleBooks = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fantasy / Fiction",
    rating: 4.6,
    totalCopies: 20,
    availableCopies: 10,
    description:
      "A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death.",
    coverColor: "#1c1f40",
    coverUrl: "https://m.media-amazon.com/images/I/81J6APjwxlL.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death. A dazzling novel about all the choices that go into a life well lived, The Midnight Library tells the story of Nora Seed as she finds herself between life and death.",
      
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help / Productivity",
    rating: 4.9,
    totalCopies: 99,
    availableCopies: 50,
    description:
      "A revolutionary guide to making good habits, breaking bad ones, and getting 1% better every day.",
    coverColor: "#fffdf6",
    coverUrl: "https://m.media-amazon.com/images/I/81F90H7hnML.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A revolutionary guide to making good habits, breaking bad ones, and getting 1% better every day.",
  },
  {
    id: 3,
    title: "You Don't Know JS: Scope & Closures",
    author: "Kyle Simpson",
    genre: "Computer Science / JavaScript",
    rating: 4.7,
    totalCopies: 9,
    availableCopies: 5,
    description:
      "An essential guide to understanding the core mechanisms of JavaScript, focusing on scope and closures.",
    coverColor: "#f8e036",
    coverUrl:
      "https://m.media-amazon.com/images/I/7186YfjgHHL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "An essential guide to understanding the core mechanisms of JavaScript, focusing on scope and closures.",
  },
  {
    id: 4,
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Philosophy / Adventure",
    rating: 4.5,
    totalCopies: 78,
    availableCopies: 50,
    description:
      "A magical tale of Santiago, an Andalusian shepherd boy, who embarks on a journey to find a worldly treasure.",
    coverColor: "#ed6322",
    coverUrl:
      "https://m.media-amazon.com/images/I/61HAE8zahLL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A magical tale of Santiago, an Andalusian shepherd boy, who embarks on a journey to find a worldly treasure.",
  },
  {
    id: 5,
    title: "Deep Work",
    author: "Cal Newport",
    genre: "Self-Help / Productivity",
    rating: 4.7,
    totalCopies: 23,
    availableCopies: 23,
    description:
      "Rules for focused success in a distracted world, teaching how to cultivate deep focus to achieve peak productivity.",
    coverColor: "#ffffff",
    coverUrl: "https://m.media-amazon.com/images/I/81JJ7fyyKyS.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "Rules for focused success in a distracted world, teaching how to cultivate deep focus to achieve peak productivity.",
  },
  {
    id: 6,
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Computer Science / Programming",
    rating: 4.8,
    totalCopies: 56,
    availableCopies: 56,
    description:
      "A handbook of agile software craftsmanship, offering best practices and principles for writing clean and maintainable code.",
    coverColor: "#080c0d",
    coverUrl:
      "https://m.media-amazon.com/images/I/71T7aD3EOTL._UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A handbook of agile software craftsmanship, offering best practices and principles for writing clean and maintainable code.",
  },
  {
    id: 7,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt, David Thomas",
    genre: "Computer Science / Programming",
    rating: 4.8,
    totalCopies: 25,
    availableCopies: 3,
    description:
      "A timeless guide for developers to hone their skills and improve their programming practices.",
    coverColor: "#100f15",
    coverUrl:
      "https://m.media-amazon.com/images/I/71VStSjZmpL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "A timeless guide for developers to hone their skills and improve their programming practices.",
  },
  {
    id: 8,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    genre: "Finance / Self-Help",
    rating: 4.8,
    totalCopies: 10,
    availableCopies: 5,
    description:
      "Morgan Housel explores the unique behaviors and mindsets that shape financial success and decision-making.",
    coverColor: "#ffffff",
    coverUrl:
      "https://m.media-amazon.com/images/I/81Dky+tD+pL._AC_UF1000,1000_QL80_.jpg",
    videoUrl: "/sample-video.mp4?updatedAt=1722593504152",
    summary:
      "Morgan Housel explores the unique behaviors and mindsets that shape financial success and decision-making.",
  },
];

export const sorts = [
  {
    value: "oldest",
    label: "Oldest",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "available",
    label: "Available",
  },
  {
    value: "highestRated",
    label: "Highest Rated",
  },
];

export const userRoles = [
  {
    value: "user",
    label: "User",
    bgColor: "bg-[#FDF2FA]",
    textColor: "text-[#C11574]",
  },
  {
    value: "admin",
    label: "Admin",
    bgColor: "bg-[#ECFDF3]",
    textColor: "text-[#027A48]",
  },
];

export const borrowStatuses = [
  {
    value: "overdue",
    label: "Overdue",
    bgColor: "bg-[#FFF1F3]",
    textColor: "text-[#C01048]",
  },
  {
    value: "borrowed",
    label: "Borrowed",
    bgColor: "bg-[#F9F5FF]",
    textColor: "text-[#6941C6]",
  },
  {
    value: "returned",
    label: "Returned",
    bgColor: "bg-[#F0F9FF]",
    textColor: "text-[#026AA2]",
  },
];

// Contact Us / feedback message workflow states (contact_messages.status).
// UNREAD → READ → RESOLVED. Matches the message_status pg enum values.
export const messageStatuses = [
  {
    value: "UNREAD",
    label: "Unread",
    bgColor: "bg-[#FFF6E6]",
    textColor: "text-[#B54708]",
  },
  {
    value: "READ",
    label: "Read",
    bgColor: "bg-[#F0F9FF]",
    textColor: "text-[#026AA2]",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    bgColor: "bg-[#ECFDF3]",
    textColor: "text-[#027A48]",
  },
];

// User Category + Grade Level — MNHS classifies its library users into
// STUDENT / TEACHER / STAFF. This is intentionally distinct from the system
// `role` (USER / ADMIN), which is managed separately by the application/admin
// system. ADMIN is NOT offered as a user category.
export const userCategories = [
  {
    value: "STUDENT",
    label: "Student",
  },
  {
    value: "TEACHER",
    label: "Teacher",
  },
  {
    value: "STAFF",
    label: "Staff",
  },
];

// Grade Level only applies to STUDENT users.
export const gradeLevels = [
  {
    value: "GRADE_7",
    label: "Grade 7",
  },
  {
    value: "GRADE_8",
    label: "Grade 8",
  },
  {
    value: "GRADE_9",
    label: "Grade 9",
  },
  {
    value: "GRADE_10",
    label: "Grade 10",
  },
  {
    value: "GRADE_11",
    label: "Grade 11",
  },
  {
    value: "GRADE_12",
    label: "Grade 12",
  },
];

export const userCategoryLabels: Record<string, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  STAFF: "Staff",
};

export const gradeLevelLabels: Record<string, string> = {
  GRADE_7: "Grade 7",
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  GRADE_12: "Grade 12",
};

// ─── Admin Notification Center ─────────────────────────────────────────────

// Category tabs shown on the page. "ALL" is a UI-only filter, never a DB value.
export const notificationCategories = [
  { value: "ALL", label: "All" },
  { value: "BOOK", label: "Books" },
  { value: "ACCOUNT", label: "Account Requests" },
  { value: "MESSAGE", label: "Messages" },
  { value: "SYSTEM", label: "System" },
];

// Event-type filter options per category (context-aware). Only event types that
// are actually implemented are offered — never hard-coded unsupported ones.
export const notificationTypeOptions: Record<
  string,
  { value: string; label: string }[]
> = {
  ALL: [
    { value: "all", label: "All" },
    { value: "BOOK_BORROWED", label: "Borrowed" },
    { value: "BOOK_RETURNED", label: "Returned" },
    { value: "BOOK_DUE_SOON", label: "Due Soon" },
    { value: "BOOK_OVERDUE", label: "Overdue" },
    { value: "ACCOUNT_REQUEST", label: "New Request" },
    { value: "ACCOUNT_APPROVED", label: "Approved" },
    { value: "ACCOUNT_REJECTED", label: "Rejected" },
    { value: "NEW_MESSAGE", label: "New Message" },
  ],
  BOOK: [
    { value: "all", label: "All" },
    { value: "BOOK_BORROWED", label: "Borrowed" },
    { value: "BOOK_RETURNED", label: "Returned" },
    { value: "BOOK_DUE_SOON", label: "Due Soon" },
    { value: "BOOK_OVERDUE", label: "Overdue" },
  ],
  ACCOUNT: [
    { value: "all", label: "All" },
    { value: "ACCOUNT_REQUEST", label: "New Request" },
    { value: "ACCOUNT_APPROVED", label: "Approved" },
    { value: "ACCOUNT_REJECTED", label: "Rejected" },
  ],
  MESSAGE: [
    { value: "all", label: "All" },
    { value: "NEW_MESSAGE", label: "New Message" },
  ],
  SYSTEM: [{ value: "all", label: "All" }],
};

// Human-readable label + emoji for each event type (for the feed).
export const notificationTypeDetails: Record<
  string,
  { label: string; emoji: string }
> = {
  BOOK_BORROWED: { label: "Book Borrowed", emoji: "📚" },
  BOOK_RETURNED: { label: "Book Returned", emoji: "📚" },
  BOOK_DUE_SOON: { label: "Book Due Soon", emoji: "⏰" },
  BOOK_OVERDUE: { label: "Book Overdue", emoji: "⚠️" },
  ACCOUNT_REQUEST: { label: "New Account Request", emoji: "👤" },
  ACCOUNT_APPROVED: { label: "Account Approved", emoji: "✅" },
  ACCOUNT_REJECTED: { label: "Account Rejected", emoji: "❌" },
  NEW_MESSAGE: { label: "New Message", emoji: "💬" },
};

// Category badge styling (reuses existing admin Badge color patterns).
export const notificationCategoryBadge: Record<
  string,
  { label: string; bgColor: string; textColor: string }
> = {
  BOOK: { label: "Books", bgColor: "bg-[#F9F5FF]", textColor: "text-[#6941C6]" },
  ACCOUNT: { label: "Account Requests", bgColor: "bg-[#FFF6E6]", textColor: "text-[#B54708]" },
  MESSAGE: { label: "Messages", bgColor: "bg-[#F0F9FF]", textColor: "text-[#026AA2]" },
  SYSTEM: { label: "System", bgColor: "bg-[#ECFDF3]", textColor: "text-[#027A48]" },
};

// Where a notification's entity should navigate the admin. If a page cannot
// yet open a specific record, we route to the relevant admin page.
export const notificationEntityRoutes: Record<string, string> = {
  CONTACT_MESSAGE: "/admin/messages",
  ACCOUNT_REQUEST: "/admin/account-requests",
  BORROW_RECORD: "/admin/borrow-records",
  BOOK: "/admin/books",
};
