import React from "react";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { UsersTable } from "./users-table";

export default async function Page() {
  // Fetch only approved users
  const approvedUsers = await db
    .select()
    .from(users)
    .where(eq(users.status, "APPROVED"))
    .orderBy(users.createdAt);

  return (
    <section className="w-full rounded-2xl bg-white dark:bg-gray-800 p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold dark:text-white">Approved Users</h2>
      </div>

      <div className="mt-7 w-full overflow-hidden">
        <UsersTable data={approvedUsers} />
      </div>
    </section>
  );
}