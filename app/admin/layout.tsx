import React, { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import "@/styles/admin.css";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import FloatingChat from "@/components/FloatingChat";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { ThemeProvider } from "@/components/theme-providers";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  if (!session?.user?.id) redirect("/sign-in");

  const isAdmin = await db
    .select({ isAdmin: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then((res) => res[0]?.isAdmin === "ADMIN");

  if (!isAdmin) redirect("/");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="admin-theme"
    >
      <main className="flex min-h-screen w-full flex-row bg-white dark:bg-gray-900 transition-colors">
        <Sidebar session={session} />

        <div className="admin-container bg-gray-50 dark:bg-gray-800 transition-colors">
          <Header session={session} />
          {children}
        </div>
        
        {/* Floating Chat Widget */}
        <FloatingChat />
      </main>
    </ThemeProvider>
  );
};
export default Layout;