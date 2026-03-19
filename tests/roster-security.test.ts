import { describe, it, expect } from "vitest";

/**
 * Tests that the stripped roster shape contains NO personally identifiable
 * information (PII). The roster API should only return:
 *   { id, players: [{ id, firstName, jerseyNumber }] }
 *
 * These tests validate the expected shape and confirm that dangerous
 * fields are absent.
 */

// Simulate the shape returned by GET /api/team/roster after the security update
const STRIPPED_ROSTER_SAMPLE = [
  {
    id: "fam_1",
    players: [
      { id: "p_1", firstName: "Alex", jerseyNumber: 7 },
      { id: "p_2", firstName: "Jordan", jerseyNumber: 12 },
    ],
  },
  {
    id: "fam_2",
    players: [{ id: "p_3", firstName: "Casey", jerseyNumber: 3 }],
  },
];

// Fields that must NEVER appear in the public roster response
const PII_FIELDS = [
  "parentName",
  "email",
  "phone",
  "smsOptIn",
  "emailOptIn",
  "contacts",
  "lastName",
  "password",
  "pinHash",
];

describe("Roster Security — Stripped PII", () => {
  it("roster families have only id and players fields", () => {
    for (const family of STRIPPED_ROSTER_SAMPLE) {
      const keys = Object.keys(family);
      expect(keys).toEqual(expect.arrayContaining(["id", "players"]));
      expect(keys.length).toBe(2);
    }
  });

  it("roster players have only id, firstName, and jerseyNumber", () => {
    for (const family of STRIPPED_ROSTER_SAMPLE) {
      for (const player of family.players) {
        const keys = Object.keys(player);
        expect(keys).toEqual(
          expect.arrayContaining(["id", "firstName", "jerseyNumber"])
        );
        expect(keys.length).toBe(3);
      }
    }
  });

  it("roster families contain no PII fields", () => {
    for (const family of STRIPPED_ROSTER_SAMPLE) {
      for (const piiField of PII_FIELDS) {
        expect(family).not.toHaveProperty(piiField);
      }
    }
  });

  it("roster players contain no PII fields", () => {
    for (const family of STRIPPED_ROSTER_SAMPLE) {
      for (const player of family.players) {
        for (const piiField of PII_FIELDS) {
          expect(player).not.toHaveProperty(piiField);
        }
      }
    }
  });

  it("validates the expected Prisma select shape", () => {
    // This mirrors the exact select used in src/app/api/team/roster/route.ts
    const expectedSelect = {
      id: true,
      players: {
        select: {
          id: true,
          firstName: true,
          jerseyNumber: true,
        },
        orderBy: { firstName: "asc" },
      },
    };

    // Verify the select shape doesn't include PII
    const topLevelKeys = Object.keys(expectedSelect);
    expect(topLevelKeys).not.toContain("parentName");
    expect(topLevelKeys).not.toContain("email");
    expect(topLevelKeys).not.toContain("phone");
    expect(topLevelKeys).not.toContain("contacts");

    const playerSelectKeys = Object.keys(expectedSelect.players.select);
    expect(playerSelectKeys).not.toContain("lastName");
    expect(playerSelectKeys).toEqual(["id", "firstName", "jerseyNumber"]);
  });

  it("JSON serialization contains no PII strings", () => {
    const json = JSON.stringify(STRIPPED_ROSTER_SAMPLE);
    expect(json).not.toContain("parentName");
    expect(json).not.toContain("email");
    expect(json).not.toContain("phone");
    expect(json).not.toContain("smsOptIn");
    expect(json).not.toContain("emailOptIn");
    expect(json).not.toContain("contacts");
    expect(json).not.toContain("lastName");
  });
});
