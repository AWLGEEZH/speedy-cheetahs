import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "EEE, MMM d");
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "h:mm a");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "EEE, MMM d 'at' h:mm a");
}

export function formatDateTimeRange(
  start: Date | string,
  end?: Date | string | null,
): string {
  const startDate = new Date(start);
  if (!end) return format(startDate, "EEE, MMM d 'at' h:mm a");
  const endDate = new Date(end);
  // Same calendar day → "Sat, Mar 14 · 3:00 PM – 5:00 PM"
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${format(startDate, "EEE, MMM d")} · ${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`;
  }
  // Different days (edge case)
  return `${format(startDate, "EEE, MMM d 'at' h:mm a")} – ${format(endDate, "EEE, MMM d 'at' h:mm a")}`;
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone;
}
