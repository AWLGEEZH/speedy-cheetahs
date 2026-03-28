import { describe, it, expect } from "vitest";
import { FIELD_POSITIONS } from "../src/lib/constants";

/**
 * Extract the core logic used in the game day UI for testability:
 * - Filtering players by confirmed attendance for batting lineup
 * - Auto-assigning fielding positions with rotation
 */

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

// Mirrors the batting lineup filtering logic from BattingTab.initializeLineup/regenerateLineup
function filterConfirmedForBatting(
  players: Player[],
  confirmedPlayerIds: Set<string>
): Player[] {
  if (confirmedPlayerIds.size > 0) {
    return players.filter((p) => confirmedPlayerIds.has(p.id));
  }
  return players; // fallback to all players if no attendance taken
}

// Mirrors the auto-assign rotation logic from FieldingTab.autoAssignPositions/regenerateFielding
function buildFieldingAssignments(
  players: Player[],
  confirmedPlayerIds: Set<string>,
  currentInning: number
): { playerId: string; position: string }[] {
  const fieldPositions = FIELD_POSITIONS.filter((p) => p.value !== "BENCH");
  const confirmedPlayers = players.filter((p) => confirmedPlayerIds.has(p.id));
  const assignments: { playerId: string; position: string }[] = [];

  if (confirmedPlayers.length === 0) return [];

  const offset = ((currentInning - 1) * fieldPositions.length) % confirmedPlayers.length;

  confirmedPlayers.forEach((_, index) => {
    const playerIndex = (index + offset) % confirmedPlayers.length;
    const player = confirmedPlayers[playerIndex];
    if (index < fieldPositions.length) {
      assignments.push({ playerId: player.id, position: fieldPositions[index].value });
    } else {
      assignments.push({ playerId: player.id, position: "BENCH" });
    }
  });

  // Non-confirmed players get BENCH
  players.forEach((p) => {
    if (!confirmedPlayerIds.has(p.id)) {
      assignments.push({ playerId: p.id, position: "BENCH" });
    }
  });

  return assignments;
}

const allPlayers: Player[] = [
  { id: "p1", firstName: "Alice", lastName: "A" },
  { id: "p2", firstName: "Bob", lastName: "B" },
  { id: "p3", firstName: "Charlie", lastName: "C" },
  { id: "p4", firstName: "Dan", lastName: "D" },
  { id: "p5", firstName: "Eve", lastName: "E" },
  { id: "p6", firstName: "Frank", lastName: "F" },
  { id: "p7", firstName: "Grace", lastName: "G" },
  { id: "p8", firstName: "Hank", lastName: "H" },
  { id: "p9", firstName: "Ivy", lastName: "I" },
  { id: "p10", firstName: "Jake", lastName: "J" },
  { id: "p11", firstName: "Kim", lastName: "K" },
  { id: "p12", firstName: "Leo", lastName: "L" },
];

// ─── BATTING LINEUP FILTERING ─────────────────────

describe("Batting lineup player filtering", () => {
  it("filters to only confirmed players when attendance exists", () => {
    const confirmed = new Set(["p1", "p3", "p5"]);
    const result = filterConfirmedForBatting(allPlayers, confirmed);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3", "p5"]);
  });

  it("falls back to all players when no attendance taken", () => {
    const result = filterConfirmedForBatting(allPlayers, new Set());
    expect(result.length).toBe(allPlayers.length);
  });

  it("returns empty array when confirmed set has no matching players", () => {
    const confirmed = new Set(["nonexistent"]);
    const result = filterConfirmedForBatting(allPlayers, confirmed);
    expect(result.length).toBe(0);
  });

  it("preserves player order from the original list", () => {
    const confirmed = new Set(["p5", "p2", "p8"]);
    const result = filterConfirmedForBatting(allPlayers, confirmed);
    expect(result.map((p) => p.id)).toEqual(["p2", "p5", "p8"]);
  });
});

// ─── FIELDING AUTO-ASSIGN ROTATION ────────────────

describe("Fielding auto-assign rotation", () => {
  const fieldPositionCount = FIELD_POSITIONS.filter((p) => p.value !== "BENCH").length; // 10

  it("assigns field positions to confirmed players and BENCH to non-confirmed", () => {
    const confirmed = new Set(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"]);
    const result = buildFieldingAssignments(allPlayers, confirmed, 1);

    // 10 confirmed get field positions, 2 non-confirmed get BENCH
    const fieldAssigned = result.filter((a) => a.position !== "BENCH");
    const benched = result.filter((a) => a.position === "BENCH");
    expect(fieldAssigned.length).toBe(10);
    expect(benched.length).toBe(2);
    expect(benched.map((a) => a.playerId)).toContain("p11");
    expect(benched.map((a) => a.playerId)).toContain("p12");
  });

  it("benches extra confirmed players when more than field positions", () => {
    // All 12 confirmed but only 10 field positions
    const confirmed = new Set(allPlayers.map((p) => p.id));
    const result = buildFieldingAssignments(allPlayers, confirmed, 1);

    const fieldAssigned = result.filter((a) => a.position !== "BENCH");
    const benched = result.filter((a) => a.position === "BENCH");
    expect(fieldAssigned.length).toBe(fieldPositionCount);
    expect(benched.length).toBe(allPlayers.length - fieldPositionCount);
  });

  it("returns empty when no confirmed players", () => {
    const result = buildFieldingAssignments(allPlayers, new Set(), 1);
    expect(result.length).toBe(0);
  });

  it("rotates positions across innings", () => {
    const confirmed = new Set(allPlayers.map((p) => p.id));
    const inning1 = buildFieldingAssignments(allPlayers, confirmed, 1);
    const inning2 = buildFieldingAssignments(allPlayers, confirmed, 2);

    // The player assigned to PITCHER in inning 1 should differ from inning 2
    const pitcher1 = inning1.find((a) => a.position === "PITCHER");
    const pitcher2 = inning2.find((a) => a.position === "PITCHER");
    expect(pitcher1?.playerId).not.toBe(pitcher2?.playerId);
  });

  it("assigns all field positions with no duplicates", () => {
    const confirmed = new Set(allPlayers.map((p) => p.id));
    const result = buildFieldingAssignments(allPlayers, confirmed, 1);

    const fieldAssigned = result.filter((a) => a.position !== "BENCH");
    const positions = fieldAssigned.map((a) => a.position);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(fieldPositionCount);
  });

  it("handles fewer players than field positions", () => {
    const fewPlayers = allPlayers.slice(0, 5);
    const confirmed = new Set(fewPlayers.map((p) => p.id));
    const result = buildFieldingAssignments(fewPlayers, confirmed, 1);

    // All 5 get field positions, none benched
    expect(result.length).toBe(5);
    const benched = result.filter((a) => a.position === "BENCH");
    expect(benched.length).toBe(0);
  });

  it("includes every player in assignments (confirmed + non-confirmed)", () => {
    const confirmed = new Set(["p1", "p2", "p3"]);
    const result = buildFieldingAssignments(allPlayers, confirmed, 1);

    const assignedIds = result.map((a) => a.playerId);
    for (const p of allPlayers) {
      expect(assignedIds).toContain(p.id);
    }
  });
});
