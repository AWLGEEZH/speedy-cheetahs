import { describe, it, expect } from "vitest";
import { deCollideBatting, deCollideFielding } from "../src/lib/gameday-anti-repeat";

interface P {
  id: string;
}

const fieldPositions = [
  { value: "PITCHER" },
  { value: "CATCHER" },
  { value: "FIRST_BASE" },
  { value: "SECOND_BASE" },
  { value: "THIRD_BASE" },
  { value: "SHORTSTOP" },
  { value: "LEFT_FIELD" },
  { value: "CENTER_FIELD" },
  { value: "RIGHT_FIELD" },
  { value: "RIGHT_CENTER" },
] as const;

// ─── BATTING DE-COLLIDE ────────────────────────────

describe("deCollideBatting", () => {
  it("returns shuffle unchanged when no previous data", () => {
    const shuffled: P[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const result = deCollideBatting([...shuffled], {});
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("returns shuffle unchanged when no collisions", () => {
    // Previous game: a@1, b@2, c@3. New shuffle: c, a, b — no overlap.
    const shuffled: P[] = [{ id: "c" }, { id: "a" }, { id: "b" }];
    const prev = { a: 1, b: 2, c: 3 };
    const result = deCollideBatting([...shuffled], prev);
    expect(result.map((p) => p.id)).toEqual(["c", "a", "b"]);
  });

  it("swaps when a single player would land in their previous slot", () => {
    // Previous game: a@1, b@2, c@3. New shuffle: a, c, b — a@1 collides.
    const shuffled: P[] = [{ id: "a" }, { id: "c" }, { id: "b" }];
    const prev = { a: 1, b: 2, c: 3 };
    const result = deCollideBatting([...shuffled], prev);
    // a should not be at index 0
    expect(result[0].id).not.toBe("a");
    // and prev[result[0].id] should not equal 1
    expect(prev[result[0].id as "a" | "b" | "c"]).not.toBe(1);
  });

  it("resolves all collisions when previous lineup is identical", () => {
    // Worst case: shuffle landed exactly like previous game
    const shuffled: P[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const prev = { a: 1, b: 2, c: 3, d: 4 };
    const result = deCollideBatting([...shuffled], prev);
    // No player should be at their previous slot
    for (let i = 0; i < result.length; i++) {
      expect(prev[result[i].id as keyof typeof prev]).not.toBe(i + 1);
    }
  });

  it("ignores players with no previous data (treated as constraint-free)", () => {
    // d is new (not in previous game). a@1 collides; d has no constraint.
    const shuffled: P[] = [{ id: "a" }, { id: "d" }, { id: "b" }];
    const prev = { a: 1, b: 2 }; // d not in prev
    const result = deCollideBatting([...shuffled], prev);
    // After de-collide, a is not at index 0
    expect(result[0].id).not.toBe("a");
  });

  it("mutates the array in place and returns it", () => {
    const shuffled: P[] = [{ id: "a" }, { id: "b" }];
    const prev = { a: 1, b: 2 };
    const result = deCollideBatting(shuffled, prev);
    expect(result).toBe(shuffled); // same reference
  });

  it("handles single-player case", () => {
    const shuffled: P[] = [{ id: "a" }];
    const prev = { a: 1 };
    const result = deCollideBatting([...shuffled], prev);
    // Cannot swap a 1-element array — accepts collision
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });
});

// ─── FIELDING DE-COLLIDE ───────────────────────────

describe("deCollideFielding", () => {
  it("returns shuffle unchanged when no previous data", () => {
    const shuffled: P[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const result = deCollideFielding([...shuffled], fieldPositions, {});
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("returns shuffle unchanged when no collisions", () => {
    // Previous: a=PITCHER, b=CATCHER. Now shuffle places b@PITCHER, a@CATCHER — no collision.
    const shuffled: P[] = [{ id: "b" }, { id: "a" }];
    const prev = { a: "PITCHER", b: "CATCHER" };
    const result = deCollideFielding([...shuffled], fieldPositions, prev);
    expect(result.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("swaps when a player would land at their previous position", () => {
    // Previous: a=PITCHER, b=CATCHER. Shuffle: a@PITCHER, b@CATCHER — both collide.
    const shuffled: P[] = [{ id: "a" }, { id: "b" }];
    const prev = { a: "PITCHER", b: "CATCHER" };
    const result = deCollideFielding([...shuffled], fieldPositions, prev);
    // Neither should be at their previous position
    expect(prev[result[0].id as keyof typeof prev]).not.toBe(fieldPositions[0].value);
    expect(prev[result[1].id as keyof typeof prev]).not.toBe(fieldPositions[1].value);
  });

  it("resolves a 10-player full-collision scenario", () => {
    // Worst case: shuffle landed exactly like previous game (Kai always at PITCHER scenario)
    const players = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    const shuffled: P[] = players.map((id) => ({ id }));
    const prev: Record<string, string> = {};
    players.forEach((id, idx) => {
      prev[id] = fieldPositions[idx].value;
    });
    const result = deCollideFielding([...shuffled], fieldPositions, prev);
    // After de-collide, no player at their previous position
    for (let i = 0; i < result.length; i++) {
      expect(prev[result[i].id]).not.toBe(fieldPositions[i].value);
    }
  });

  it("ignores positions beyond fieldPositions length (extras treated as bench)", () => {
    // 12 players, only 10 field positions; positions 11-12 are not de-collided
    const players = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const shuffled: P[] = players.map((id) => ({ id }));
    const prev: Record<string, string> = {
      a: fieldPositions[0].value, // collides at index 0
    };
    const result = deCollideFielding([...shuffled], fieldPositions, prev);
    expect(result[0].id).not.toBe("a");
    // Length unchanged
    expect(result.length).toBe(12);
  });

  it("ignores players with no previous data", () => {
    // c is new. a collides at PITCHER.
    const shuffled: P[] = [{ id: "a" }, { id: "c" }];
    const prev = { a: "PITCHER", b: "CATCHER" };
    const result = deCollideFielding([...shuffled], fieldPositions, prev);
    expect(result[0].id).not.toBe("a");
  });

  it("mutates the array in place and returns it", () => {
    const shuffled: P[] = [{ id: "a" }, { id: "b" }];
    const prev = { a: "PITCHER" };
    const result = deCollideFielding(shuffled, fieldPositions, prev);
    expect(result).toBe(shuffled);
  });
});
