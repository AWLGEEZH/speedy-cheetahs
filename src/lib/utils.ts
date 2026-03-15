import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, startOfWeek, startOfDay, addWeeks, isSameWeek, isSameDay, isBefore, subDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TEAM_TIMEZONE = "America/Los_Angeles";

/**
 * Convert a Date to one whose local-time methods return Pacific time values.
 * This ensures date-fns format() produces Pacific-timezone output regardless
 * of whether code runs on a UTC server or a PDT/PST client.
 */
function toPacific(date: Date): Date {
  const pacific = date.toLocaleString("en-US", { timeZone: TEAM_TIMEZONE });
  return new Date(pacific);
}

export function formatDate(date: Date | string): string {
  return format(toPacific(new Date(date)), "EEE, MMM d");
}

export function formatTime(date: Date | string): string {
  return format(toPacific(new Date(date)), "h:mm a");
}

export function formatDateTime(date: Date | string): string {
  return format(toPacific(new Date(date)), "EEE, MMM d 'at' h:mm a");
}

export function formatDateTimeRange(
  start: Date | string,
  end?: Date | string | null,
): string {
  const startDate = toPacific(new Date(start));
  if (!end) return format(startDate, "EEE, MMM d 'at' h:mm a");
  const endDate = toPacific(new Date(end));
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

/**
 * Build a map of event ID → numbered label like "Practice #1", "Preseason Game #2", "Game #3".
 * Events must be sorted by date (ascending) before calling.
 */
export function buildEventLabels(
  events: { id: string; title: string; type: string }[],
): Map<string, string> {
  const labels = new Map<string, string>();
  let practiceNum = 0;
  let preseasonNum = 0;
  let gameNum = 0;

  for (const evt of events) {
    if (evt.type === "PRACTICE") {
      practiceNum++;
      labels.set(evt.id, `Practice #${practiceNum}`);
    } else if (
      evt.type === "GAME" &&
      evt.title.toLowerCase().includes("preseason")
    ) {
      preseasonNum++;
      labels.set(evt.id, `Preseason Game #${preseasonNum}`);
    } else if (evt.type === "GAME") {
      gameNum++;
      labels.set(evt.id, `Game #${gameNum}`);
    } else {
      labels.set(evt.id, evt.title);
    }
  }

  return labels;
}

/**
 * Group events into "This Week", "Next Week", or month names for events further out.
 * Past events get their own "Past" group. Events must be sorted by date ascending.
 */
export function groupEventsByPeriod<T extends { date: string }>(
  events: T[],
): { label: string; events: T[] }[] {
  if (events.length === 0) return [];

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
  const nextWeekStart = addWeeks(thisWeekStart, 1);
  const nextWeekEnd = addWeeks(thisWeekStart, 2);

  const groups = new Map<string, T[]>();
  const order: string[] = [];

  for (const event of events) {
    const eventDate = new Date(event.date);
    let label: string;

    if (isBefore(eventDate, thisWeekStart)) {
      label = "Past";
    } else if (isSameWeek(eventDate, now, { weekStartsOn: 0 })) {
      label = "This Week";
    } else if (isBefore(eventDate, nextWeekEnd) && !isBefore(eventDate, nextWeekStart)) {
      label = "Next Week";
    } else {
      label = format(eventDate, "MMMM yyyy");
    }

    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }
    groups.get(label)!.push(event);
  }

  return order.map((label) => ({ label, events: groups.get(label)! }));
}

/**
 * Group updates into "Today", "Yesterday", "Earlier This Week", or "Last Week".
 * Updates must be sorted by createdAt descending (newest first).
 * Only updates from the trailing 7 days should be passed in.
 */
export function groupUpdatesByPeriod<T extends { createdAt: string | Date }>(
  updates: T[],
): { label: string; updates: T[] }[] {
  if (updates.length === 0) return [];

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });

  const groups = new Map<string, T[]>();
  const order: string[] = [];

  for (const update of updates) {
    const updateDate = new Date(update.createdAt);
    let label: string;

    if (isSameDay(updateDate, now)) {
      label = "Today";
    } else if (isSameDay(updateDate, subDays(now, 1))) {
      label = "Yesterday";
    } else if (isBefore(thisWeekStart, updateDate) || isSameDay(updateDate, thisWeekStart)) {
      label = "Earlier This Week";
    } else {
      label = "Last Week";
    }

    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }
    groups.get(label)!.push(update);
  }

  return order.map((label) => ({ label, updates: groups.get(label)! }));
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
