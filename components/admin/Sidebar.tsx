"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Session } from "next-auth";
import { ArrowLeft, LogOut } from "lucide-react";

import { adminSidebarSections } from "@/constants";
import { cn, getInitials } from "@/lib/utils";
import { handleSignOut } from "@/lib/actions/auth-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LogoutConfirmation from "@/components/ui/logout-confirmation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = ({ session }: { session: Session }) => {
  const pathname = usePathname();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement | null>(null);

  // Preserve original active-route matching, including nested admin routes
  // (e.g. /admin/books/new, /admin/books/edit/[id], /admin/announcements/edit/[id]).
  const isActive = (route: string) =>
    (route !== "/admin" && pathname.includes(route) && route.length > 1) ||
    pathname === route;

  const handleConfirmed = () => {
    setIsLogoutOpen(false);
    try { logoutFormRef.current?.requestSubmit(); } catch { logoutFormRef.current?.submit(); }
  };

  return (
    <aside className="admin-sidebar bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-colors">
      {/* Fixed logo header */}
      <div className="logo">
        <Image
          src="/icons/logo.svg"
          alt="MNHS Main Smart Library logo"
          height={36}
          width={36}
          priority
          className="shrink-0"
        />
        <h1 className="text-gray-900 dark:text-white transition-colors">
          MNHS MAIN <br />
          Smart Library
        </h1>
      </div>

      {/* Scrollable navigation — the profile section below stays pinned */}
      <nav aria-label="Admin navigation" className="nav-scroll">
        {adminSidebarSections.map((section) => (
          <div className="nav-group" key={section.label}>
            <p className="nav-group-label">{section.label}</p>

            <div className="flex flex-col gap-1">
              {section.links.map((link) => {
                const isSelected = isActive(link.route);

                return (
                  <Link
                    href={link.route}
                    key={link.route}
                    title={link.text}
                    aria-current={isSelected ? "page" : undefined}
                    className={cn(
                      "link transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                      isSelected &&
                        "active-indicator bg-primary-admin shadow-sm hover:bg-primary-admin/95 dark:bg-blue-600 dark:hover:bg-blue-600",
                    )}
                  >
                    <span className="relative size-5 shrink-0">
                      <Image
                        src={link.img}
                        alt=""
                        fill
                        className={`${isSelected ? "brightness-0 invert" : "dark:invert"} object-contain transition-all`}
                      />
                    </span>

                    <span
                      className={cn(
                        "link-label transition-colors",
                        isSelected ? "text-white" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {link.text}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pinned profile / account area */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Account menu for ${session?.user?.name ?? "administrator"}`}
            className="user cursor-pointer border-gray-200 bg-gray-50 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-admin/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/70 dark:focus-visible:ring-blue-500/50 max-md:border-0 max-md:bg-transparent max-md:hover:bg-transparent max-md:dark:bg-transparent max-md:dark:hover:bg-transparent"
          >
            <span className="relative shrink-0 rounded-full ring-2 ring-emerald-500/30 dark:ring-emerald-400/40">
              <Avatar className="size-9">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-xs font-bold text-white">
                  {getInitials(session?.user?.name || "IN")}
                </AvatarFallback>
              </Avatar>

              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-800"
              />
            </span>

            <span className="flex min-w-0 flex-1 flex-col max-md:hidden">
              <span className="truncate text-sm font-semibold text-gray-900 dark:text-white transition-colors">
                {session?.user?.name}
              </span>
              <span className="truncate text-xs text-gray-500 dark:text-gray-400 transition-colors">
                {session?.user?.email}
              </span>
            </span>

            <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 max-md:hidden">
              Admin
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-60">
          <DropdownMenuLabel>
            <p className="truncate text-sm font-semibold">{session?.user?.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{session?.user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" className="cursor-pointer">
              <ArrowLeft className="size-4" />
              Back to User App
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setIsLogoutOpen(true);
            }}
            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300"
          >
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reuses the exact same sign-out flow as the admin header */}
      <LogoutConfirmation open={isLogoutOpen} onOpenChange={setIsLogoutOpen} onConfirm={handleConfirmed} />
      <form ref={logoutFormRef} action={handleSignOut} className="hidden">
        <button type="submit" />
      </form>
    </aside>
  );
};

export default Sidebar;
