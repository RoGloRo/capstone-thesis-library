"use client";

import Image from "next/image";
import { adminSideBarLinks } from "@/constants";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Session } from "next-auth";

const Sidebar = ({ session }: { session: Session }) => {
  const pathname = usePathname();

  return (
    <div className="admin-sidebar bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-colors">
      <div>
        <div className="logo">
          <Image
            src="/icons/admin/logo.svg"
            alt="logo"
            height={37}
            width={37}
          />
          <h1 className="text-gray-900 dark:text-white transition-colors">Smart Library</h1>
        </div>

        <div className="mt-10 flex flex-col gap-5">
          {adminSideBarLinks.map((link) => {
            const isSelected =
              (link.route !== "/admin" &&
                pathname.includes(link.route) &&
                link.route.length > 1) ||
              pathname === link.route;

            return (
              <Link href={link.route} key={link.route}>
                <div
                  className={cn(
                    "link transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                    isSelected && "bg-primary-admin dark:bg-blue-600 shadow-sm",
                  )}
                >
                  <div className="relative size-5">
                    <Image
                      src={link.img}
                      alt="icon"
                      fill
                      className={`${isSelected ? "brightness-0 invert" : "dark:invert"}  object-contain transition-all`}
                    />
                  </div>

                  <p className={cn(
                    "transition-colors",
                    isSelected ? "text-white" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {link.text}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="user bg-gray-50 dark:bg-gray-800 transition-colors">
        <Avatar>
          <AvatarFallback className="bg-amber-100 dark:bg-amber-200 text-amber-800 dark:text-amber-900">
            {getInitials(session?.user?.name || "IN")}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col max-md:hidden">
          <p className="font-semibold text-gray-900 dark:text-white transition-colors">{session?.user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{session?.user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
