import { describe, it, expect, vi, afterEach } from "vitest";
import { groupEventsByPeriod } from "@/lib/utils";

// Helper to create an event with a given date string
function makeEvent(id: string, dateStr: string) {
  return { id, date: dateStr };
}

describe("groupEventsByPeriod", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty array for empty input", () => {
    expect(groupEventsByPeriod([])).toEqual([]);
  });

  it("groups events in the current week under 'This Week'", () => {
    // Fix "now" to Wednesday March 11, 2026 at noon
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));

    const events = [
      makeEvent("1", "2026-03-09T10:00:00Z"), // Sunday Mar 9 (week start)
      makeEvent("2", "2026-03-11T18:00:00Z"), // Wednesday Mar 11
      makeEvent("3", "2026-03-14T09:00:00Z"), // Saturday Mar 14
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("This Week");
    expect(result[0].events).toHaveLength(3);
  });

  it("groups events in next week under 'Next Week'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0)); // Wed Mar 11

    const events = [
      makeEvent("1", "2026-03-16T10:00:00Z"), // Mon Mar 16 (next week)
      makeEvent("2", "2026-03-18T18:00:00Z"), // Wed Mar 18 (next week)
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Next Week");
    expect(result[0].events).toHaveLength(2);
  });

  it("groups past events under 'Past'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0)); // Wed Mar 11

    const events = [
      makeEvent("1", "2026-03-01T10:00:00Z"), // Mar 1 (past)
      makeEvent("2", "2026-03-05T18:00:00Z"), // Mar 5 (past)
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Past");
    expect(result[0].events).toHaveLength(2);
  });

  it("groups far-future events by month name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0)); // Wed Mar 11

    const events = [
      makeEvent("1", "2026-04-05T10:00:00Z"), // April
      makeEvent("2", "2026-04-12T18:00:00Z"), // April
      makeEvent("3", "2026-05-01T10:00:00Z"), // May
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("April 2026");
    expect(result[0].events).toHaveLength(2);
    expect(result[1].label).toBe("May 2026");
    expect(result[1].events).toHaveLength(1);
  });

  it("correctly separates events across all period types", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0)); // Wed Mar 11

    const events = [
      makeEvent("past1", "2026-03-01T10:00:00Z"),   // Past
      makeEvent("past2", "2026-03-07T10:00:00Z"),   // Past (Saturday before this week)
      makeEvent("this1", "2026-03-10T10:00:00Z"),   // This Week (Mon)
      makeEvent("this2", "2026-03-12T10:00:00Z"),   // This Week (Thu)
      makeEvent("next1", "2026-03-16T10:00:00Z"),   // Next Week (Mon)
      makeEvent("apr1", "2026-04-10T10:00:00Z"),    // April
      makeEvent("may1", "2026-05-15T10:00:00Z"),    // May
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(5);
    expect(result[0].label).toBe("Past");
    expect(result[0].events).toHaveLength(2);
    expect(result[1].label).toBe("This Week");
    expect(result[1].events).toHaveLength(2);
    expect(result[2].label).toBe("Next Week");
    expect(result[2].events).toHaveLength(1);
    expect(result[3].label).toBe("April 2026");
    expect(result[3].events).toHaveLength(1);
    expect(result[4].label).toBe("May 2026");
    expect(result[4].events).toHaveLength(1);
  });

  it("preserves order of groups as they appear in events", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0)); // Wed Mar 11

    // Events sorted ascending — groups should appear in chronological order
    const events = [
      makeEvent("1", "2026-03-01T10:00:00Z"),  // Past
      makeEvent("2", "2026-03-11T10:00:00Z"),  // This Week
      makeEvent("3", "2026-03-17T10:00:00Z"),  // Next Week
      makeEvent("4", "2026-04-01T10:00:00Z"),  // April
    ];

    const result = groupEventsByPeriod(events);
    const labels = result.map((g) => g.label);
    expect(labels).toEqual(["Past", "This Week", "Next Week", "April 2026"]);
  });

  it("preserves event objects in their groups", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));

    const event = { id: "e1", date: "2026-03-11T10:00:00Z", title: "Practice", type: "PRACTICE" };
    const result = groupEventsByPeriod([event]);

    expect(result[0].events[0]).toBe(event); // same object reference
    expect(result[0].events[0].title).toBe("Practice");
  });

  it("handles a single event", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));

    const result = groupEventsByPeriod([makeEvent("1", "2026-03-11T10:00:00Z")]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("This Week");
    expect(result[0].events).toHaveLength(1);
  });

  it("handles events on the boundary between this week and next week", () => {
    vi.useFakeTimers();
    // Set to Saturday March 14, near end of the week (week starts Sunday March 8)
    vi.setSystemTime(new Date(2026, 2, 14, 12, 0, 0));

    const events = [
      makeEvent("1", "2026-03-14T18:00:00Z"), // Saturday — still "This Week"
      makeEvent("2", "2026-03-15T10:00:00Z"), // Sunday — start of next week
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("This Week");
    expect(result[0].events).toHaveLength(1);
    expect(result[1].label).toBe("Next Week");
    expect(result[1].events).toHaveLength(1);
  });

  it("groups multiple events in same far-future month together", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 12, 0, 0));

    const events = [
      makeEvent("1", "2026-06-01T10:00:00Z"),
      makeEvent("2", "2026-06-15T10:00:00Z"),
      makeEvent("3", "2026-06-28T10:00:00Z"),
    ];

    const result = groupEventsByPeriod(events);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("June 2026");
    expect(result[0].events).toHaveLength(3);
  });

  it("handles events spanning across years", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 28, 12, 0, 0)); // Dec 28, 2026

    const events = [
      makeEvent("1", "2026-12-29T10:00:00Z"), // This week
      makeEvent("2", "2027-01-05T10:00:00Z"), // Next week or January 2027
      makeEvent("3", "2027-02-10T10:00:00Z"), // February 2027
    ];

    const result = groupEventsByPeriod(events);
    expect(result.length).toBeGreaterThanOrEqual(2);
    // At minimum, the Feb event should be in "February 2027"
    const febGroup = result.find((g) => g.label === "February 2027");
    expect(febGroup).toBeDefined();
    expect(febGroup!.events).toHaveLength(1);
  });
});
