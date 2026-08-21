import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="mt-12">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-ink-muted dark:text-slate-400">
          <span>© Smart Library</span>
          <span className="mx-2">|</span>
          <Link href="/about-us" className="text-ink hover:text-green-700 dark:text-slate-300 dark:hover:text-slate-100 hover:underline transition-colors duration-150">About</Link>
          <span className="mx-2">|</span>
          <Link href="/about-us" className="text-ink hover:text-green-700 dark:text-slate-300 dark:hover:text-slate-100 hover:underline transition-colors duration-150">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
