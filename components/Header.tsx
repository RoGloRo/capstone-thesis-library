"use client";
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";

const Header = ({session}: {session: Session}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim());
      router.push(`/library?search=${query}`);
    }
  };

  return <header className="my-10 flex items-center justify-between gap-5">
    <Link href="/" className="flex-shrink-0">
      <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
    </Link>

    {/* Enhanced Search Bar */}
    <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-orange-100/50 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:border-amber-300/70">
          <input
            type="text"
            placeholder="Search books, authors, or categories..."
            className={`w-full py-3 pl-12 bg-transparent rounded-full text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-transparent transition-all duration-300 ${searchQuery ? 'pr-28 sm:pr-32' : 'pr-16 sm:pr-20'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search books, authors, or categories"
          />
          
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition-colors duration-300">
            <Image
              src="/icons/search-fill.svg"
              alt="Search"
              width={20}
              height={20}
              className="opacity-70 group-hover:opacity-100"
            />
          </div>
          
          {/* Enhanced Search Button */}
          <button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5"
            aria-label="Search"
          >
            <span className="hidden sm:inline">Search</span>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          {/* Enhanced Clear Button (when there's text) */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-20 sm:right-24 top-1/2 transform -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-full p-1.5 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Search Suggestions Placeholder */}
        {searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-300 z-50">
            <div className="p-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Quick Search</span>
              </div>
              <p>Press Enter to search for &ldquo;<span className="text-amber-600 font-medium">{searchQuery}</span>&rdquo; in our library</p>
            </div>
          </div>
        )}
      </div>
    </form>

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