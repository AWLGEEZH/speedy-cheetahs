import { describe, it, expect } from "vitest";
import { buildEventLabels } from "@/lib/utils";

describe("buildEventLabels", () => {
  it("returns empty map for no events", () => {
    const labels = buildEventLabels([]);
    expect(labels.size).toBe(0);
  });

  it("numbers practices sequentially", () => {
    const events = [
      { id: "p1", title: "Practice", type: "PRACTICE" },
      { id: "p2", title: "Practice", type: "PRACTICE" },
      { id: "p3", title: "Practice", type: "PRACTICE" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("p1")).toBe("Practice #1");
    expect(labels.get("p2")).toBe("Practice #2");
    expect(labels.get("p3")).toBe("Practice #3");
  });

  it("numbers regular games sequentially", () => {
    const events = [
      { id: "g1", title: "Game vs Blue Jays", type: "GAME" },
      { id: "g2", title: "Game vs Red Sox", type: "GAME" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("g1")).toBe("Game #1");
    expect(labels.get("g2")).toBe("Game #2");
  });

  it("numbers preseason games separately from regular games", () => {
    const events = [
      { id: "pre1", title: "Preseason Scrimmage", type: "GAME" },
      { id: "pre2", title: "Preseason Game vs Eagles", type: "GAME" },
      { id: "g1", title: "Game vs Blue Jays", type: "GAME" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("pre1")).toBe("Preseason Game #1");
    expect(labels.get("pre2")).toBe("Preseason Game #2");
    expect(labels.get("g1")).toBe("Game #1");
  });

  it("detects preseason case-insensitively", () => {
    const events = [
      { id: "pre1", title: "PRESEASON game", type: "GAME" },
      { id: "pre2", title: "preseason Scrimmage", type: "GAME" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("pre1")).toBe("Preseason Game #1");
    expect(labels.get("pre2")).toBe("Preseason Game #2");
  });

  it("handles mixed event types with independent numbering", () => {
    const events = [
      { id: "p1", title: "Practice", type: "PRACTICE" },
      { id: "pre1", title: "Preseason Scrimmage", type: "GAME" },
      { id: "p2", title: "Practice", type: "PRACTICE" },
      { id: "g1", title: "Game vs Blue Jays", type: "GAME" },
      { id: "p3", title: "Practice", type: "PRACTICE" },
      { id: "g2", title: "Game vs Red Sox", type: "GAME" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("p1")).toBe("Practice #1");
    expect(labels.get("pre1")).toBe("Preseason Game #1");
    expect(labels.get("p2")).toBe("Practice #2");
    expect(labels.get("g1")).toBe("Game #1");
    expect(labels.get("p3")).toBe("Practice #3");
    expect(labels.get("g2")).toBe("Game #2");
  });

  it("uses title for OTHER event types", () => {
    const events = [
      { id: "o1", title: "Team Party", type: "OTHER" },
      { id: "o2", title: "Picture Day", type: "OTHER" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("o1")).toBe("Team Party");
    expect(labels.get("o2")).toBe("Picture Day");
  });

  it("returns map with same size as input", () => {
    const events = [
      { id: "p1", title: "Practice", type: "PRACTICE" },
      { id: "g1", title: "Game", type: "GAME" },
      { id: "o1", title: "Special Event", type: "OTHER" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.size).toBe(3);
  });

  it("handles a single practice event", () => {
    const events = [{ id: "p1", title: "Practice", type: "PRACTICE" }];
    const labels = buildEventLabels(events);
    expect(labels.get("p1")).toBe("Practice #1");
  });

  it("handles a single game event", () => {
    const events = [{ id: "g1", title: "Game vs Tigers", type: "GAME" }];
    const labels = buildEventLabels(events);
    expect(labels.get("g1")).toBe("Game #1");
  });

  it("handles preseason in middle of title", () => {
    const events = [
      { id: "pre1", title: "Game (Preseason) vs Eagles", type: "GAME" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("pre1")).toBe("Preseason Game #1");
  });

  it("does not treat practice type as preseason even if title says preseason", () => {
    const events = [
      { id: "p1", title: "Preseason Practice", type: "PRACTICE" },
    ];
    const labels = buildEventLabels(events);
    // PRACTICE type takes priority — still labeled Practice #1
    expect(labels.get("p1")).toBe("Practice #1");
  });

  it("handles unknown event types using title as fallback", () => {
    const events = [
      { id: "x1", title: "Fun Run", type: "SPECIAL" },
    ];
    const labels = buildEventLabels(events);
    expect(labels.get("x1")).toBe("Fun Run");
  });
});
