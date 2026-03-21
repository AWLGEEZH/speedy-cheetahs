import { describe, it, expect } from "vitest";
import { normalizePhone } from "@/lib/utils";

/**
 * Tests for phone number deduplication logic used in
 * SMS/email sending (updates route + volunteer reminders cron).
 *
 * The fix normalizes all phones before inserting into a Set,
 * ensuring the same number in different formats is deduplicated.
 */

describe("Phone Number Deduplication", () => {
  it("normalizePhone handles 10-digit number", () => {
    expect(normalizePhone("2403838225")).toBe("+12403838225");
  });

  it("normalizePhone handles 11-digit number with leading 1", () => {
    expect(normalizePhone("12403838225")).toBe("+12403838225");
  });

  it("normalizePhone handles formatted number", () => {
    expect(normalizePhone("(240) 383-8225")).toBe("+12403838225");
  });

  it("normalizePhone handles dashed number", () => {
    expect(normalizePhone("240-383-8225")).toBe("+12403838225");
  });

  it("normalizePhone handles already normalized number", () => {
    expect(normalizePhone("+12403838225")).toBe("+12403838225");
  });

  it("deduplicates same phone in different formats via Set", () => {
    const rawPhones = [
      "+12403838225",         // family primary (normalized)
      "(240) 383-8225",       // contact 1 (formatted)
      "240-383-8225",         // contact 2 (dashed)
      "2403838225",           // contact 3 (digits only)
      "+12403838225",         // another family with same phone
    ];

    const phoneSet = new Set<string>();
    for (const p of rawPhones) {
      phoneSet.add(normalizePhone(p));
    }

    // All 5 entries should collapse to 1 unique phone
    expect(phoneSet.size).toBe(1);
    expect([...phoneSet]).toEqual(["+12403838225"]);
  });

  it("keeps different phone numbers distinct", () => {
    const rawPhones = [
      "+12403838225",
      "(301) 555-1234",
      "4105550000",
    ];

    const phoneSet = new Set<string>();
    for (const p of rawPhones) {
      phoneSet.add(normalizePhone(p));
    }

    expect(phoneSet.size).toBe(3);
  });

  it("deduplicates across families and contacts", () => {
    // Simulate the exact data structure from the updates route
    const families = [
      {
        phone: "+12403838225",
        contacts: [
          { phone: "(240) 383-8225" },  // same as primary
          { phone: "3015551234" },       // different number
        ],
      },
      {
        phone: "+12403838225",           // same primary as family 1
        contacts: [
          { phone: "240-383-8225" },     // same again
          { phone: null },               // no phone
        ],
      },
    ];

    const phoneSet = new Set<string>();
    for (const f of families) {
      phoneSet.add(normalizePhone(f.phone));
      for (const c of f.contacts) {
        if (c.phone) phoneSet.add(normalizePhone(c.phone));
      }
    }

    const phones = [...phoneSet];
    // Should only be 2 unique numbers: +12403838225 and +13015551234
    expect(phones.length).toBe(2);
    expect(phones).toContain("+12403838225");
    expect(phones).toContain("+13015551234");
  });

  it("deduplicates emails case-insensitively", () => {
    const rawEmails = [
      "Parent@Example.com",
      "parent@example.com",
      "PARENT@EXAMPLE.COM",
      "different@example.com",
    ];

    const emailSet = new Set<string>();
    for (const e of rawEmails) {
      emailSet.add(e.toLowerCase().trim());
    }

    expect(emailSet.size).toBe(2);
    expect([...emailSet]).toContain("parent@example.com");
    expect([...emailSet]).toContain("different@example.com");
  });
});
