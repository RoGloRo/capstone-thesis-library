"use client";
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const Header = ({session}: {session: Session}) => {
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");

  return <header className="my-10 flex items-center justify-between gap-5">
    <Link href="/" className="flex-shrink-0">
      <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
    </Link>

    {/* Search Bar */}
    <div className="flex-1 max-w-2xl mx-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search books, authors, or categories..."
          className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Image
          src="/icons/search-fill.svg"
          alt="Search"
          width={20}
          height={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>

    <div className="flex items-center gap-6">
      <Link href="/" className={cn("text-base cursor-pointer capitalize hover:text-amber-500 transition-colors", 
        pathname === "/" ? "text-amber-500 font-medium" : "text-gray-700")}>
        Home
      </Link>
      
      <Link href="/library" className={cn("text-base cursor-pointer capitalize hover:text-amber-500 transition-colors", 
        pathname.startsWith("/library") ? "text-amber-500 font-medium" : "text-gray-700")}>
        Library
      </Link>
      
      {/* Notification Bell */}
      <button className="relative p-2 text-gray-600 hover:text-amber-500 transition-colors">
        <Image 
          src="/icons/notification-bell.svg" 
          alt="Notifications" 
          width={24} 
          height={24} 
        />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      
      {/* User Profile */}
      <Link href="/my-profile" className="ml-2">
        <Avatar className="border-2 border-amber-100 hover:border-amber-300 transition-colors">
          <AvatarFallback className="bg-amber-100 text-amber-800 font-medium">
            {getInitials(session?.user?.name || "IN")}
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  </header>;
}
export default Header