"use client";
import { Avatar, AvatarFallback} from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils";
import { Session } from "next-auth";
import { handleSignOut } from "@/lib/actions/auth-actions";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { FormEvent, useState, useEffect, useRef } from "react";
import { LogOut, Menu, X, Home, Library, Bell, User, MessageSquare, Info } from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import LogoutConfirmation from "@/components/ui/logout-confirmation";

const Header = ({session}: {session: Session}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const currentLogoutFormRef = useRef<HTMLFormElement | null>(null);
  const desktopLogoutFormRef = useRef<HTMLFormElement | null>(null);
  const mobileLogoutFormRef = useRef<HTMLFormElement | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim());
      router.push(`/library?search=${query}`);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const closeNotifications = () => {
    setIsNotificationOpen(false);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (!isMobileSearchOpen) {
      // Auto-focus will be handled in useEffect
      setMobileSearchQuery("");
    }
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setMobileSearchQuery("");
  };

  const handleMobileSearch = (e: FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      const query = encodeURIComponent(mobileSearchQuery.trim());
      router.push(`/library?search=${query}`);
      closeMobileSearch();
    }
  };

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}/role-check`);
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.isAdmin);
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
        }
      }
    };

    checkAdminRole();
  }, [session?.user?.id]);

  // Auto-focus mobile search input when opened
  useEffect(() => {
    if (isMobileSearchOpen) {
      const searchInput = document.getElementById('mobile-search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }
  }, [isMobileSearchOpen]);

  // Close mobile menu and search when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        closeMobileMenu();
      }
      if (isMobileSearchOpen && !target.closest('.mobile-search-container')) {
        closeMobileSearch();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          closeMobileMenu();
        }
        if (isMobileSearchOpen) {
          closeMobileSearch();
        }
      }
    };

    if (isMobileMenuOpen || isMobileSearchOpen) {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isMobileSearchOpen]);

  const handleConfirmedLogout = () => {
    setIsLogoutOpen(false);
    try {
      // submit the selected hidden form which uses the server action
      currentLogoutFormRef.current?.requestSubmit();
    } catch (err) {
      currentLogoutFormRef.current?.submit();
    }
  };

  return <>
    <header className="my-10 flex items-center justify-between gap-5">
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link href="/" className="flex-shrink-0">
          <Image src="/icons/logo.svg" alt="logo" width={40} height={40} />
        </Link>
        
        {/* AI Assistant Link */}
        <Link href="/chat" className={cn(
          "relative px-4 py-2 text-base font-medium rounded-lg transition-all duration-300 ease-out group",
          pathname.startsWith("/chat") 
            ? "text-emerald-700 bg-emerald-50/80 shadow-sm" 
            : "text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/60"
        )}>
          <span className="relative z-10">LiVro</span>
          <div className={cn(
            "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-300 ease-out",
            pathname.startsWith("/chat") ? "w-6" : "w-0 group-hover:w-4"
          )}></div>
        </Link>
      </div>

      {/* Enhanced Search Bar - Hidden on mobile */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 hidden md:block">
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

      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-2">
        <Link href="/" className={cn(
          "relative px-4 py-2 text-base font-medium capitalize rounded-lg transition-all duration-300 ease-out group",
          pathname === "/" 
            ? "text-amber-600 bg-amber-50/80 shadow-sm" 
            : "text-gray-700 hover:text-amber-600 hover:bg-amber-50/60"
        )}>
          <span className="relative z-10">Home</span>
          <div className={cn(
            "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 ease-out",
            pathname === "/" ? "w-8" : "w-0 group-hover:w-6"
          )}></div>
        </Link>
        
        <Link href="/library" className={cn(
          "relative px-4 py-2 text-base font-medium capitalize rounded-lg transition-all duration-300 ease-out group",
          pathname.startsWith("/library") 
            ? "text-amber-600 bg-amber-50/80 shadow-sm" 
            : "text-gray-700 hover:text-amber-600 hover:bg-amber-50/60"
        )}>
          <span className="relative z-10">Library</span>
          <div className={cn(
            "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 ease-out",
            pathname.startsWith("/library") ? "w-8" : "w-0 group-hover:w-6"
          )}></div>
        </Link>

        <Link href="/about-us" className={cn(
          "relative px-4 py-2 text-base font-medium capitalize rounded-lg transition-all duration-300 ease-out group",
          pathname.startsWith("/about-us")
            ? "text-amber-600 bg-amber-50/80 shadow-sm"
            : "text-gray-700 hover:text-amber-600 hover:bg-amber-50/60"
        )}>
          <span className="relative z-10">About</span>
          <div className={cn(
            "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 ease-out",
            pathname.startsWith("/about-us") ? "w-8" : "w-0 group-hover:w-6"
          )}></div>
        </Link>

        {/* Admin Panel Link - Only show for admin users on desktop */}
        {isAdmin && (
          <Link href="/admin" className={cn(
            "relative px-4 py-2 text-base font-medium capitalize rounded-lg transition-all duration-300 ease-out group",
            pathname.startsWith("/admin") 
              ? "text-purple-600 bg-purple-50/80 shadow-sm" 
              : "text-gray-700 hover:text-purple-600 hover:bg-purple-50/60"
          )}>
            <span className="relative z-10">Admin Panel</span>
            <div className={cn(
              "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300 ease-out",
              pathname.startsWith("/admin") ? "w-8" : "w-0 group-hover:w-6"
            )}></div>
          </Link>
        )}
        
        {/* Notification Bell with Dropdown */}
        <NotificationDropdown
          isOpen={isNotificationOpen}
          onToggle={toggleNotifications}
          onClose={closeNotifications}
        />
        
        {/* Logout Button */}
        <button
          onClick={() => {
            currentLogoutFormRef.current = desktopLogoutFormRef.current;
            setIsLogoutOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg transition-all duration-300 group"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden sm:inline">Logout</span>
        </button>
        {/* Hidden form to trigger server action for desktop logout */}
        <form ref={desktopLogoutFormRef} action={handleSignOut} className="hidden">
          <button type="submit" />
        </form>
        
        {/* User Profile */}
        <Link href="/my-profile" className="ml-2">
          <Avatar className="border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
            <AvatarFallback className="bg-emerald-100 text-emerald-800 font-medium">
              {getInitials(session?.user?.name || "IN")}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="md:hidden flex items-center gap-4">
        {/* Mobile Search Icon */}
        <button 
          onClick={toggleMobileSearch}
          className={`mobile-search-container p-2 transition-colors ${
            isMobileSearchOpen ? 'text-amber-500' : 'text-gray-600 hover:text-amber-500'
          }`}
          aria-label="Toggle search"
        >
          <Image 
            src="/icons/search-fill.svg" 
            alt="Search" 
            width={20} 
            height={20} 
          />
        </button>

        {/* Mobile Burger Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="mobile-menu-container p-2 text-gray-600 hover:text-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 rounded-lg"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>
    </header>

    {/* Mobile Inline Search Bar */}
    {isMobileSearchOpen && (
      <div className="md:hidden mb-4 mobile-search-container">
        <form onSubmit={handleMobileSearch} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Image
                src="/icons/search-fill.svg"
                alt="Search"
                width={18}
                height={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-70"
              />
              <input
                id="mobile-search-input"
                type="text"
                placeholder="Search books, authors, categories..."
                className="w-full py-3 pl-10 pr-4 bg-white/20 border border-white/30 rounded-lg text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!mobileSearchQuery.trim()}
              className="px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center min-w-[80px]"
            >
              Search
            </button>
            <button
              type="button"
              onClick={closeMobileSearch}
              className="px-3 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 flex items-center justify-center"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    )}

    {/* Mobile Navigation Menu Overlay */}
    {isMobileMenuOpen && (
      <div className="md:hidden fixed inset-0 z-50 mobile-menu-container">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
        
        {/* Slide-out Menu */}
        <div className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-md shadow-2xl border-l border-gray-200/60 transform transition-transform duration-300 ease-out",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/60">
            <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 rounded-lg"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col h-full">
            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-4 space-y-2">
              <Link 
                href="/" 
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-amber-50 active:scale-95",
                  pathname === "/" 
                    ? "text-amber-600 bg-amber-50 border border-amber-200" 
                    : "text-gray-700 hover:text-amber-600"
                )}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              
              <Link 
                href="/library" 
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-amber-50 active:scale-95",
                  pathname.startsWith("/library") 
                    ? "text-amber-600 bg-amber-50 border border-amber-200" 
                    : "text-gray-700 hover:text-amber-600"
                )}
              >
                <Library className="w-5 h-5" />
                <span>Library</span>
              </Link>

              <Link 
                href="/about-us" 
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-amber-50 active:scale-95",
                  pathname.startsWith("/about-us") 
                    ? "text-amber-600 bg-amber-50 border border-amber-200" 
                    : "text-gray-700 hover:text-amber-600"
                )}
              >
                <Info className="w-5 h-5" />
                <span>About</span>
              </Link>

              {/* AI Assistant Link */}
              <Link 
                href="/chat" 
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-emerald-50 active:scale-95",
                  pathname.startsWith("/chat") 
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200" 
                    : "text-gray-700 hover:text-emerald-600"
                )}
              >
                <MessageSquare className="w-5 h-5" />
                <span>AI Assistant</span>
              </Link>

              {/* Admin Link - Only show for admin users */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-purple-50 active:scale-95",
                    pathname.startsWith("/admin") 
                      ? "text-purple-600 bg-purple-50 border border-purple-200" 
                      : "text-gray-700 hover:text-purple-600"
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin Panel</span>
                </Link>
              )}

              <Link 
                href="/my-profile" 
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:bg-amber-50 active:scale-95",
                  pathname.startsWith("/my-profile") 
                    ? "text-amber-600 bg-amber-50 border border-amber-200" 
                    : "text-gray-700 hover:text-amber-600"
                )}
              >
                <User className="w-5 h-5" />
                <span>My Profile</span>
              </Link>

              {/* Mobile Notifications */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 transition-all duration-200">
                <Bell className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-700 flex-1">Notifications</span>
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onToggle={toggleNotifications}
                  onClose={closeNotifications}
                />
              </div>

              {/* Logout Button in Navigation */}
              <button
                onClick={() => {
                  currentLogoutFormRef.current = mobileLogoutFormRef.current;
                  setIsLogoutOpen(true);
                  closeMobileMenu();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all duration-300 active:scale-95 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
              <form ref={mobileLogoutFormRef} action={handleSignOut} className="hidden">
                <button type="submit" />
              </form>

              {/* Full Search Bar for Mobile */}
              <div className="pt-4 pb-2">
                <form onSubmit={(e) => {
                  handleSearch(e);
                  closeMobileMenu(); // Auto-close sidebar after search
                }} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search books, authors..."
                      className="w-full py-3 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search books, authors, or categories"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Image
                        src="/icons/search-fill.svg"
                        alt="Search"
                        width={18}
                        height={18}
                        className="opacity-70"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                  >
                    Search Library
                  </button>
                </form>
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="border-t border-gray-200/60 p-6">
              {/* User Info Display Only */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                <Avatar className="w-8 h-8 border-2 border-emerald-100">
                  <AvatarFallback className="bg-emerald-100 text-emerald-800 text-sm font-medium">
                    {getInitials(session?.user?.name || "IN")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium">{session?.user?.name || "User"}</span>
                  <span className="text-sm text-gray-500">{session?.user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    <LogoutConfirmation open={isLogoutOpen} onOpenChange={setIsLogoutOpen} onConfirm={handleConfirmedLogout} />
  </>;
}
export default Header
