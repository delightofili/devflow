import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// cn() is the shadcn/ui utility for merging Tailwind classes
// use this everywhere instead of string concatenation

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
// slugify("My Awesome Team") → "my-awesome-team"

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
// getInitials("Nonso Ofili") → "NO"

export function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const PRIORITY_CONFIG = {
  NO_PRIORITY: { label: "No priority", color: "text-slate-400" },
  LOW: { label: "Low", color: "text-blue-400" },
  MEDIUM: { label: "Medium", color: "text-yellow-400" },
  HIGH: { label: "High", color: "text-orange-400" },
  URGENT: { label: "Urgent", color: "text-red-400" },
} as const;

export const STATUS_CONFIG = {
  BACKLOG: { label: "Backlog", color: "text-slate-400" },
  TODO: { label: "Todo", color: "text-blue-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-400" },
  IN_REVIEW: { label: "In Review", color: "text-purple-400" },
  DONE: { label: "Done", color: "text-green-400" },
} as const;
