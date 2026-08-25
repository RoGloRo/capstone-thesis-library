import React, { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import "@/styles/admin.css";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import FloatingChat from "@/components/FloatingChat";
import { isAdminUser } from "@/lib/auth-guard";
import { ThemeProvider } from "@/components/theme-providers";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  // Preserve exact behavior: unauthenticated → /sign-in, non-admin → /
  if (!session?.user?.id) redirect("/sign-in");
  if (!(await isAdminUser())) redirect("/");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="smart-library-theme"
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