import { describe, it, expect, vi, afterEach } from "vitest";
import { groupUpdatesByPeriod } from "@/lib/utils";

function makeUpdate(id: string, createdAt: string) {
  return { id, createdAt };
}

describe("groupUpdatesByPeriod", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty array for empty input", () => {
    expect(groupUpdatesByPeriod([])).toEqual([]);
  });

  it("groups updates from today under 'Today'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 15, 0, 0)); // Sat Mar 14, 3pm

    const updates = [
      makeUpdate("1", "2026-03-14T14:00:00Z"),
      makeUpdate("2", "2026-03-14T09:00:00Z"),
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Today");
    expect(result[0].updates).toHaveLength(2);
  });

  it("groups updates from yesterday under 'Yesterday'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 15, 0, 0)); // Sat Mar 14

    const updates = [
      makeUpdate("1", "2026-03-13T18:00:00Z"),
      makeUpdate("2", "2026-03-13T10:00:00Z"),
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Yesterday");
    expect(result[0].updates).toHaveLength(2);
  });

  it("groups updates from earlier this week under 'Earlier This Week'", () => {
    vi.useFakeTimers();
    // Friday Mar 13, 2026 — week started Sunday Mar 8
    vi.setSystemTime(new Date(2026, 2, 13, 15, 0, 0));

    const updates = [
      makeUpdate("1", "2026-03-10T10:00:00Z"), // Tuesday
      makeUpdate("2", "2026-03-09T10:00:00Z"), // Monday
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Earlier This Week");
    expect(result[0].updates).toHaveLength(2);
  });

  it("groups updates from before this week under 'Last Week'", () => {
    vi.useFakeTimers();
    // Thursday Mar 12, 2026 — week started Sunday Mar 8
    vi.setSystemTime(new Date(2026, 2, 12, 15, 0, 0));

    const updates = [
      makeUpdate("1", "2026-03-07T10:00:00Z"), // Saturday (prev week)
      makeUpdate("2", "2026-03-06T10:00:00Z"), // Friday (prev week)
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Last Week");
    expect(result[0].updates).toHaveLength(2);
  });

  it("separates updates across all period types", () => {
    vi.useFakeTimers();
    // Saturday Mar 14, 2026 — week started Sunday Mar 8
    vi.setSystemTime(new Date(2026, 2, 14, 18, 0, 0));

    const updates = [
      makeUpdate("today1", "2026-03-14T10:00:00Z"),    // Today (Sat)
      makeUpdate("yest1", "2026-03-13T10:00:00Z"),     // Yesterday (Fri)
      makeUpdate("earlier1", "2026-03-10T10:00:00Z"),   // Tue (earlier this week)
      makeUpdate("earlier2", "2026-03-08T10:00:00Z"),   // Sun (earlier this week — week start)
      makeUpdate("last1", "2026-03-07T10:00:00Z"),      // Sat (last week)
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(4);
    expect(result[0].label).toBe("Today");
    expect(result[0].updates).toHaveLength(1);
    expect(result[1].label).toBe("Yesterday");
    expect(result[1].updates).toHaveLength(1);
    expect(result[2].label).toBe("Earlier This Week");
    expect(result[2].updates).toHaveLength(2);
    expect(result[3].label).toBe("Last Week");
    expect(result[3].updates).toHaveLength(1);
  });

  it("preserves group order based on first appearance (newest-first input)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 18, 0, 0));

    // Updates sorted newest-first
    const updates = [
      makeUpdate("1", "2026-03-14T10:00:00Z"),  // Today
      makeUpdate("2", "2026-03-13T10:00:00Z"),  // Yesterday
      makeUpdate("3", "2026-03-07T10:00:00Z"),  // Last Week
    ];

    const result = groupUpdatesByPeriod(updates);
    const labels = result.map((g) => g.label);
    expect(labels).toEqual(["Today", "Yesterday", "Last Week"]);
  });

  it("preserves original update objects", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 18, 0, 0));

    const update = { id: "u1", createdAt: "2026-03-14T10:00:00Z", title: "Rain delay", coach: "Doyle" };
    const result = groupUpdatesByPeriod([update]);

    expect(result[0].updates[0]).toBe(update); // same reference
    expect(result[0].updates[0].title).toBe("Rain delay");
  });

  it("handles a single update", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 18, 0, 0));

    const result = groupUpdatesByPeriod([makeUpdate("1", "2026-03-14T10:00:00Z")]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Today");
    expect(result[0].updates).toHaveLength(1);
  });

  it("handles updates on the week boundary (Sunday start of week = 'Earlier This Week', not 'Last Week')", () => {
    vi.useFakeTimers();
    // Wednesday Mar 11, 2026 — week started Sunday Mar 8
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));

    const updates = [
      makeUpdate("1", "2026-03-08T10:00:00Z"), // Sunday Mar 8 (start of this week)
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Earlier This Week");
  });

  it("handles updates with Date objects instead of strings", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 18, 0, 0));

    const updates = [
      { id: "1", createdAt: new Date("2026-03-14T10:00:00Z") },
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Today");
  });

  it("labels yesterday as 'Yesterday' even when it falls in the previous week (Sunday start)", () => {
    vi.useFakeTimers();
    // Sunday Mar 8, 2026 — this is the start of the week
    vi.setSystemTime(new Date(2026, 2, 8, 12, 0, 0));

    const updates = [
      makeUpdate("today", "2026-03-08T10:00:00Z"), // Today (Sun, week start)
      makeUpdate("yest", "2026-03-07T10:00:00Z"),  // Yesterday (Sat, prev week — but "Yesterday" takes priority)
      makeUpdate("last", "2026-03-05T10:00:00Z"),  // Thursday (prev week — actual "Last Week")
    ];

    const result = groupUpdatesByPeriod(updates);
    expect(result).toHaveLength(3);
    expect(result[0].label).toBe("Today");
    expect(result[1].label).toBe("Yesterday");
    expect(result[2].label).toBe("Last Week");
  });
});
