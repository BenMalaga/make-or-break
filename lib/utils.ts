import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className merge (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a point total like "1,240". */
export function formatPoints(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Short relative time, e.g. "3d ago". Keeps deps light (no date lib needed). */
export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const table: [number, string][] = [
    [60, "s"],
    [3600, "m"],
    [86400, "h"],
    [604800, "d"],
    [2629800, "w"],
    [31557600, "mo"],
    [Infinity, "y"],
  ];
  let prev = 1;
  for (const [limit, label] of table) {
    if (seconds < limit) {
      const value = Math.floor(seconds / prev);
      return value <= 0 ? "just now" : `${value}${label} ago`;
    }
    prev = limit;
  }
  return "just now";
}

/** Turn arbitrary text into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
