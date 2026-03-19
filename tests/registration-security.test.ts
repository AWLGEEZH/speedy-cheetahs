import { describe, it, expect, vi, beforeEach } from "vitest";

// Must set AUTH_SECRET BEFORE family-auth.ts is imported (module-level check)
vi.hoisted(() => {
  process.env.AUTH_SECRET =
    "ba40dd10c1fa54a7651e1a28f1d9aff1a768aed36723f5027fb3071c7df250ae";
});

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

import {
  updateTeamSettingsSchema,
  verifyCodeSchema,
  verifyPhoneSchema,
  confirmPinSchema,
} from "@/lib/validators";
import { createFamilyToken, verifyFamilyToken } from "@/lib/family-auth";

describe("Registration Security — Validators", () => {
  describe("updateTeamSettingsSchema", () => {
    it("accepts a valid registration code", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "DIAMONDS2026",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.registrationCode).toBe("DIAMONDS2026");
      }
    });

    it("accepts null registration code (remove code)", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.registrationCode).toBeNull();
      }
    });

    it("accepts omitted registration code (optional)", () => {
      const result = updateTeamSettingsSchema.safeParse({
        name: "My Team",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.registrationCode).toBeUndefined();
      }
    });

    it("rejects code shorter than 4 characters", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "AB",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with special characters", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "TEAM@2026!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code with spaces", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "TEAM 2026",
      });
      expect(result.success).toBe(false);
    });

    it("accepts code with mixed case and numbers", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "Team2026abc",
      });
      expect(result.success).toBe(true);
    });

    it("rejects code longer than 30 characters", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "A".repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it("accepts exactly 4-character code", () => {
      const result = updateTeamSettingsSchema.safeParse({
        registrationCode: "ABCD",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("verifyCodeSchema", () => {
    it("accepts a non-empty code", () => {
      const result = verifyCodeSchema.safeParse({ code: "DIAMONDS2026" });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = verifyCodeSchema.safeParse({ code: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing code field", () => {
      const result = verifyCodeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("verifyPhoneSchema", () => {
    it("accepts valid phone and familyId", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "2403838225",
        familyId: "fam_123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects short phone", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "123",
        familyId: "fam_123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing familyId", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "2403838225",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty familyId", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "2403838225",
        familyId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("confirmPinSchema", () => {
    it("accepts valid 6-digit PIN", () => {
      const result = confirmPinSchema.safeParse({
        phone: "2403838225",
        pin: "123456",
        familyId: "fam_123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-numeric PIN", () => {
      const result = confirmPinSchema.safeParse({
        phone: "2403838225",
        pin: "abcdef",
        familyId: "fam_123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects PIN shorter than 6 digits", () => {
      const result = confirmPinSchema.safeParse({
        phone: "2403838225",
        pin: "12345",
        familyId: "fam_123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects PIN longer than 6 digits", () => {
      const result = confirmPinSchema.safeParse({
        phone: "2403838225",
        pin: "1234567",
        familyId: "fam_123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing familyId", () => {
      const result = confirmPinSchema.safeParse({
        phone: "2403838225",
        pin: "123456",
      });
      expect(result.success).toBe(false);
    });

    it("rejects PIN with spaces", () => {
      const result = confirmPinSchema.safeParse({
        phone: "2403838225",
        pin: "12 456",
        familyId: "fam_123",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Registration Security — Family Auth Tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a valid family token", async () => {
    const token = await createFamilyToken("fam_abc123");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("verifies a valid token and returns familyId", async () => {
    const token = await createFamilyToken("fam_abc123");
    const result = await verifyFamilyToken(token);
    expect(result).not.toBeNull();
    expect(result?.familyId).toBe("fam_abc123");
  });

  it("rejects a tampered token", async () => {
    const token = await createFamilyToken("fam_abc123");
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyFamilyToken(tampered);
    expect(result).toBeNull();
  });

  it("rejects an empty string token", async () => {
    const result = await verifyFamilyToken("");
    expect(result).toBeNull();
  });

  it("rejects a completely invalid token", async () => {
    const result = await verifyFamilyToken("not-a-jwt-at-all");
    expect(result).toBeNull();
  });

  it("produces different tokens for different families", async () => {
    const token1 = await createFamilyToken("fam_1");
    const token2 = await createFamilyToken("fam_2");
    expect(token1).not.toBe(token2);

    const result1 = await verifyFamilyToken(token1);
    const result2 = await verifyFamilyToken(token2);
    expect(result1?.familyId).toBe("fam_1");
    expect(result2?.familyId).toBe("fam_2");
  });

  it("token contains purpose claim", async () => {
    const token = await createFamilyToken("fam_test");
    // Decode the payload manually
    const parts = token.split(".");
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    expect(payload.purpose).toBe("family-verify");
    expect(payload.familyId).toBe("fam_test");
  });

  it("token has expiration set", async () => {
    const token = await createFamilyToken("fam_test");
    const parts = token.split(".");
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    expect(payload.exp).toBeDefined();
    // exp should be ~15 minutes from now (900 seconds)
    const now = Math.floor(Date.now() / 1000);
    const diff = payload.exp - now;
    expect(diff).toBeGreaterThan(890);
    expect(diff).toBeLessThanOrEqual(901);
  });
});
