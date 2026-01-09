"use client"

import React, { useRef, useState } from "react";
import { Session } from "next-auth";
import { handleSignOut } from "@/lib/actions/auth-actions";
import { LogOut, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "../ui/mode-toggle";
import LogoutConfirmation from "@/components/ui/logout-confirmation";

const Header = ({ session }: { session: Session }) => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement | null>(null);
  const handleConfirmed = () => {
    setIsLogoutOpen(false);
    try { logoutFormRef.current?.requestSubmit(); } catch { logoutFormRef.current?.submit(); }
  };
  return (
    <>
    <header className="admin-header flex justify-between items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white transition-colors">
          {session?.user?.name}
        </h2>
        <p className="text-base text-slate-500 dark:text-slate-400 transition-colors">
          Monitor all of your users and books here
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <ModeToggle />
        
        {/* AI Assistant Link */}
        <Link 
          href="/chat"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500 rounded-lg transition-all duration-300 group"
          title="AI Assistant"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
          <span>AI Assistant</span>
        </Link>

        {/* Back to User App */}
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-admin dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-primary-admin dark:hover:border-blue-500 rounded-lg transition-all duration-300 group"
          title="Back to User App"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back to User App</span>
        </Link>

        {/* Logout Button */}
        <button
          onClick={() => setIsLogoutOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 border border-red-600 hover:border-red-700 dark:border-red-700 dark:hover:border-red-800 rounded-lg transition-all duration-300 group shadow-sm hover:shadow-md"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
          <span>Sign Out</span>
        </button>
        <form ref={logoutFormRef} action={handleSignOut} className="hidden"><button type="submit"/></form>
      </div>
    </header>
    <LogoutConfirmation open={isLogoutOpen} onOpenChange={setIsLogoutOpen} onConfirm={handleConfirmed} />
    </>
  );
};
export default Header;
