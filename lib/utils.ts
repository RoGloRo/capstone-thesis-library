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
