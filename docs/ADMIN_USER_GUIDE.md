# Smart Library

## Administrator / Librarian User Guide

**MNHS Main Smart Library**

*Version 1.0 — prepared for school librarians and administrators*

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Accessing the Admin Panel](#2-accessing-the-admin-panel)
3. [Admin Dashboard](#3-admin-dashboard)
4. [Sidebar / Navigation](#4-sidebar--navigation)
5. [Managing Books](#5-managing-books)
6. [Managing Users](#6-managing-users)
7. [Account Requests](#7-account-requests)
8. [Borrow Records](#8-borrow-records)
9. [Managing Announcements](#9-managing-announcements)
10. [Notifications](#10-notifications)
11. [Messages](#11-messages)
12. [Email Logs](#12-email-logs)
13. [Reports](#13-reports)
14. [Visit Logs](#14-visit-logs)
15. [Profile / Administrator Account](#15-profile--administrator-account)
16. [Common Tasks / Quick Guide](#16-common-tasks--quick-guide)
17. [Troubleshooting / Common Questions](#17-troubleshooting--common-questions)
18. [Important Notes for Librarians](#18-important-notes-for-librarians)

---

## 1. Introduction

**Smart Library** is the online library system of MNHS Main. It lets students,
teachers, and staff browse the library catalogue, borrow and return books, and
receive reminders — while giving the library staff a complete control center for
managing everything behind the scenes.

This guide is written for the **Administrator / Librarian** — the person
responsible for the day-to-day operation of the library. It explains, in simple
steps, how to use the **Admin Panel**: the private area where the librarian
manages books, people, borrowing activity, announcements, and reports.

With the Admin Panel you can:

* Add, edit, and remove **books** from the catalogue.
* **Approve or reject** new account requests from students and staff.
* View all registered **users** and manage who has administrator access.
* Monitor **borrowing activity** — what is on loan, what is overdue, and what has been returned.
* Post **announcements** that students see in the app.
* Read **messages** sent through the Contact Us form.
* Check **email logs** and send reminder emails when needed.
* Record **library visits** by scanning student QR codes.
* Generate **reports** and download them as spreadsheets.

You do **not** need any technical knowledge to follow this guide. Every section
uses the same button names and page titles that you will see on screen.

---

## 2. Accessing the Admin Panel

### 2.1 Signing In

1. Open the Smart Library website in your browser.
2. Click **Sign In**.
3. On the sign-in page ("Welcome back to MNHS MAIN Smart Library"), enter your **Email** and **Password**.
4. Click **Sign In**.

> **Screenshot:** The Sign In page with the Email and Password fields.

### 2.2 What Happens After You Sign In

* **Administrators (librarians)** are taken straight to the **Admin Panel**, opening on the **Admin Dashboard**.
* **Regular users (students, teachers, staff)** are taken to the normal library home page — they never see the Admin Panel.

In other words: the Admin Panel is a private area. Only accounts marked as
**Admin** can open it. If a regular user tries to open an admin page, the system
simply sends them back to the normal library pages.

### 2.3 If You Cannot Access the Admin Panel

* Make sure you signed in with the **administrator account** provided for the librarian — not a student account.
* If you believe your account should have admin access but the Admin Panel does not open, ask another administrator to check your account role (roles can be changed from **All Users** — see Section 6).
* If you forgot your password, contact your system administrator for help.

---

## 3. Admin Dashboard

The **Dashboard** (sidebar item **Home**) is the first page you see after signing
in. It is a one-screen summary of the whole library: how many books and users you
have, what is being borrowed, and what needs your attention today.

> **Screenshot:** Admin Dashboard showing the statistics cards, charts, and tables.

### 3.1 Statistics Cards (Top of the Page)

| Card | What It Means | Why It Is Useful |
| --- | --- | --- |
| **Total Books** | The total number of physical book copies owned by the library, with the number of distinct titles shown underneath. | A quick inventory count of your whole collection. |
| **Registered Users** | The number of **approved** library members. Below it, the system shows how many extra accounts are still pending approval or were rejected. | Tells you how many people can use the library — and reminds you to review pending requests. |
| **Borrowed Today** | How many borrow transactions happened today (the Philippine calendar day). | A daily activity check — how busy the library was. |
| **Currently Borrowed** | How many books are on loan right now (not yet returned). | Your "books currently out" counter. |
| **Overdue Books** | How many borrowed books are past their due date and still not returned. | The number to watch — these books need follow-up. |
| **Total Returned Books** | The all-time number of return transactions since the library started using the system. | Shows the lifetime borrowing volume of the library. |

### 3.2 AI Library Insights

The **AI Library Insights** card lets the system analyze your library data and
write short, plain-language observations for you (for example trends in
borrowing, overdue books, or inactive users).

**How to use it:**

1. Click **Generate Insights**.
2. Wait a few seconds while the analysis runs.
3. Read the list of insights that appears, together with three quick figures: **Borrows (30d)**, **Overdue**, and **Inactive Users**.
4. Click **Refresh Insights** any time you want an updated analysis.

### 3.3 Charts

* **Borrowing Trends** — a chart comparing how many books were **borrowed** vs **returned** over time. It automatically shows the **last 30 days** day-by-day, or the **last 12 months** month-by-month when the library has a longer history. Use it to spot busy seasons and quiet periods.
* **Top Books** — the most-borrowed books of all time, ranked by the number of times each was borrowed. Use it to see which titles are popular and worth having more copies of.
* **Top Genres** — the most-borrowed genres of all time (the top genres plus an "Other" bucket), with the total number of borrows shown underneath. Useful for planning which shelves to grow.
* **Book Availability** — a ring chart of **physical copies currently borrowed vs available**, with the percentage borrowed shown in the middle. At a glance: how much of the collection is out on loan.
* **Top Borrowers** — the five most active approved members, ranked by the total number of books they have borrowed (all time).

### 3.4 Recent Activity Tables

* **Recently Borrowed Books** — the 10 latest borrow events, with the book, borrower, borrow date, due date, and a status badge (**Active**, **Returned**, or **Overdue**). Each row has a small download button that creates a **PDF receipt** for that loan.
* **Recently Returned Books** — the 10 latest returns, with the book, borrower, and returned date.
* **Overdue Books** — every loan that is past its due date and not yet returned, listed with the borrower, borrowed date, due date, and **days overdue**. If the list is empty, you will see a green "No overdue books — all loans are on time" message.

**Sending overdue reminders from the dashboard:** when there is at least one
overdue book, the Overdue Books card shows a red **Send Overdue Emails** button.
It opens a confirmation pop-up; confirming queues an overdue notice email for
each overdue borrower. The system also sends these automatically on its daily
schedule — the button is there when you want to send them immediately.

---

## 4. Sidebar / Navigation

Everything in the Admin Panel is reached from the **sidebar** on the left, under
the **MNHS MAIN Smart Library** logo. The links are grouped into five sections.
The item for the page you are currently on is highlighted in blue.

### Overview

* **Home** — the Admin Dashboard (Section 3).

### Library

* **All Books** — manage the book catalogue (Section 5).
* **Borrow Records** — view every borrow and return transaction (Section 8).
* **Visit Logs** — scan student QR codes and view library attendance (Section 14).

### People

* **All Users** — view and manage approved members (Section 6).
* **Account Requests** — approve or reject new sign-ups (Section 7).

### Communication

* **Notifications** — the admin activity feed (Section 10).
* **Announcements** — post news and notices for library users (Section 9).
* **Messages** — read Contact Us inquiries and feedback (Section 11).
* **Email Logs** — monitor system emails and trigger reminders (Section 12).

### Insights

* **Reports** — generate and download library reports (Section 13).

### Other Things You Will See on Every Page

* **Top bar (header):** shows your name, plus these buttons:
  * **Theme toggle** (sun/moon icon) — switch between **Light**, **Dark**, and **System** colors.
  * **Notification bell** — shows a red number when you have unread notifications; clicking it opens **Notifications**.
  * **AI Assistant** — opens the built-in AI chat assistant in a new page.
  * **Back to User App** — leaves the Admin Panel and opens the student-facing library site.
  * **Sign Out** — logs you out (asks you to confirm first).
* **Floating chat bubble:** a small chat icon in the corner of every admin page — the **AI Assistant**. Click it to ask library-related questions without leaving the page.
* **Profile button (bottom of the sidebar):** shows your avatar, name, and email with an **Admin** badge. Clicking it opens a small menu with **Back to User App** and **Sign Out** (see Section 15).

> **Screenshot:** The Admin sidebar showing all navigation groups.

---

## 5. Managing Books

**All Books** is where the library catalogue lives. From here you can browse,
search, add, edit, and delete books.

### 5.1 Viewing Books

1. Click **All Books** in the sidebar.
2. The page shows every book in the catalogue in a table with these columns:
   * **Title** and **Author**
   * **Genre**
   * **Call Number** (the book's catalogue number, e.g. `SL-2026-012345`)
   * **ISBN / ISSN**
   * **Format** (Hardcover, Paperback, etc.)
   * **Shelf Location**
   * **Total Copies** and **Available** copies
   * **Added On** (the date the book was added)
   * **Actions** — a pencil (edit) and a trash bin (delete) icon

**Searching and filtering:**

* Use the search box ("Search by title, author, genre, call number, or ISBN...") to find a book quickly.
* Use the dropdown filters to narrow the list:
  * **All Genres** — pick one genre.
  * **All Formats** — pick one format (e.g. Paperback).
  * **All Shelves** — pick one shelf location.
  * **All Availability** — show only **Available** books (at least one copy on the shelf) or **Unavailable** books (no copies left).
* Use **Sort by:** to order the list by **Latest to Oldest** (default), **Oldest to Latest**, **Title (A–Z)**, or **Title (Z–A)**.
* Use **Previous** / **Next** at the bottom to move between pages.

### 5.2 Adding a Book

1. Open **All Books**.
2. Click **+ Create a New Book** (top-right corner).
3. Fill in the book form. It is divided into six sections — every field is described below.
4. Review the details.
5. Click **Add Book to Library** (bottom of the form).
6. You will see a green "Book added successfully!" message and be returned to **All Books**, where the new book appears at the top of the list.

> **Screenshot:** The Add Book form showing all six sections.

#### Basic Information

| Field | What to Enter | Required? |
| --- | --- | --- |
| **Title** | The complete title of the book (2–100 characters). | Yes |
| **Author** | The author's name (2–100 characters). | Yes |
| **Genre** | The category, e.g. Fiction, Science, History (2–50 characters). Use one consistent word or phrase per genre so the filters work well. | Yes |
| **Rating** | A whole number from **1 to 5** ("out of 5 stars"). | Yes |
| **Published Year** | The year the book was published (e.g. 2016). Cannot be a future year. | No |

#### Bibliographic Information

| Field | What to Enter | Required? |
| --- | --- | --- |
| **ISBN / ISSN** | The book's ISBN-10, ISBN-13, or the serial's ISSN-8 (e.g. `978-0-123456-47-2`). | No |
| **Publisher** | The publishing company (e.g. Pearson). | No |
| **Edition** | The edition statement (e.g. "2nd Edition"). | No |
| **Language** | The language of the book (e.g. English). | No |
| **Pages** | The number of pages (a whole number). | No |

#### Library Information

| Field | What to Enter | Required? |
| --- | --- | --- |
| **Call Number** | The catalogue number in the format `SL-YYYY-XXXXXX`. **Leave blank to auto-generate** one. Each call number must be unique — if it is already in use, the system will refuse to save and say "Call number already in use". | No |
| **Shelf Location** | Where the book lives on the shelves (e.g. `A-12-03`). | No |
| **Book Format** | Choose one from the dropdown: Hardcover, Paperback, E-book, Audiobook, Reference, Magazine, Journal, or Other. | No |
| **Acquisition Date** | The date the library acquired the book (use the date picker). | No |

#### Inventory Information

| Field | What to Enter | Required? |
| --- | --- | --- |
| **Add Book Copies** | How many physical copies the library owns of this title (at least 1, up to 10,000). When you change this number, **Available Copies adjusts automatically**. | Yes |
| **Available Copies** | Read-only display — calculated automatically as copies are added, borrowed, and returned. You cannot type in this box. | (Automatic) |

#### Visual Elements

| Field | What to Enter | Required? |
| --- | --- | --- |
| **Cover Image** | Paste a picture link in the box **or** click the upload area to choose an image file from your computer. A preview is shown. The cover appears wherever the book is displayed to students. | Yes |
| **Cover Color** | Pick the book's theme color using the color picker (this colors the book's placeholder/spine in the app). | Yes |
| **Video Preview** | Paste a video link **or** upload a short video (MP4, WebM, or MOV; up to 50 MB) that previews the book. A player preview appears when set. *Note: although the label says "Optional", the form currently will not save until this field has a value.* | Yes (in practice) |

#### Book Content

| Field | What to Enter | Required? |
| --- | --- | --- |
| **Full Description** | A detailed description of the book (10–1,000 characters). | Yes |
| **Short Summary** | A brief summary or excerpt (at least 10 characters) shown in book lists. | Yes |

**What happens after you save a new book:**

* The book immediately becomes visible to all approved users in the library catalogue (there is no "draft" state for books).
* Every approved user receives an in-app notification: *"New Book Available — [title] has been added to the Smart Library collection."* (No email is sent for new books.)

### 5.3 Editing a Book

1. Open **All Books**.
2. Find the book (use the search box or filters if needed).
3. Click the **pencil icon** in that row's Actions column.
4. The same book form opens, filled in with the book's current information.
5. Change any field you need to. The **Go Back** button at the top returns you to the list without saving.
6. Click **Update Book**.
7. A green "Book updated successfully!" message appears and you are returned to **All Books**.

**Important — changing the number of copies:**
When you edit **Add Book Copies**, the system adjusts **Available Copies**
automatically by the same difference. Example: a book has 5 total / 2 available
copies; you change total copies to 7 → available becomes 4. Available copies can
never go below zero. The call number of an existing book is never changed
automatically when you edit.

### 5.4 Deleting a Book

1. Open **All Books**.
2. Find the book.
3. Click the **trash bin icon** in that row's Actions column.
4. A confirmation dialog appears: *"Are you sure? This action cannot be undone. This will permanently delete the book and remove the data from our servers."*
5. Click **Delete** to permanently remove the book, or **Cancel** to keep it.
6. After deleting, the page refreshes and a "Book deleted successfully" message appears.

> **Warning:** Deletion is permanent. Deleting a book removes it from the
> catalogue completely — it is not a "hide" or "retire" function, so double-check
> that you have selected the right book before confirming.

### 5.5 Understanding Book Availability

* **Total Copies** = the number of physical copies the library owns.
* **Available Copies** = the copies currently on the shelf.
* When a student borrows a book, Available Copies goes down by one; when they return it, it goes back up. This is handled automatically.
* There is no fixed borrowing limit per student in the system; however, a student **cannot borrow the same title twice** while they still have it on loan, and they cannot borrow when Available Copies is zero.
* The **due date** of a loan is set automatically when the student borrows the book. Students choose a borrow duration when borrowing (by default 7 days, up to a maximum of 30 days).

<!-- CONTINUE -->






