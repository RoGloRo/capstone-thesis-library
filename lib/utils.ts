import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")               // split name into words
    .map(word => word[0])     // take the first letter of each word
    .join("")                 // join them together
    .toUpperCase()            // make uppercase
    .slice(0, 3);             // get max 3 letters
};

/**
 * Compact relative timestamp for notification feeds ("just now", "5m ago",
 * "3h ago", "2d ago", falling back to a locale date for older items). Shared
 * by the header bell popover and the /notifications page.
 */
export const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "Unknown time";

  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "Unknown time";

    const diffSeconds = Math.round((Date.now() - then) / 1000);
    if (diffSeconds < 0) return "Just now";
    if (diffSeconds < 60) return "Just now";

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(iso).toLocaleDateString();
  } catch {
    return "Unknown time";
  }
};
