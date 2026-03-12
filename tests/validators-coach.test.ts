import { describe, it, expect } from "vitest";
import { coachRsvpSchema, chatMessageSchema } from "@/lib/validators";

describe("Coach RSVP & Chat Validators", () => {
  describe("coachRsvpSchema", () => {
    it("accepts GOING status", () => {
      const result = coachRsvpSchema.safeParse({ status: "GOING" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("GOING");
      }
    });

    it("accepts NOT_GOING status", () => {
      const result = coachRsvpSchema.safeParse({ status: "NOT_GOING" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("NOT_GOING");
      }
    });

    it("rejects invalid status values", () => {
      const result = coachRsvpSchema.safeParse({ status: "MAYBE" });
      expect(result.success).toBe(false);
    });

    it("rejects empty status", () => {
      const result = coachRsvpSchema.safeParse({ status: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing status field", () => {
      const result = coachRsvpSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("chatMessageSchema", () => {
    it("accepts a valid message", () => {
      const result = chatMessageSchema.safeParse({ content: "Hello coaches!" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Hello coaches!");
      }
    });

    it("rejects empty content", () => {
      const result = chatMessageSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("rejects content over 2000 characters", () => {
      const longContent = "a".repeat(2001);
      const result = chatMessageSchema.safeParse({ content: longContent });
      expect(result.success).toBe(false);
    });

    it("accepts content at exactly 2000 characters", () => {
      const maxContent = "a".repeat(2000);
      const result = chatMessageSchema.safeParse({ content: maxContent });
      expect(result.success).toBe(true);
    });

    it("accepts content at exactly 1 character", () => {
      const result = chatMessageSchema.safeParse({ content: "x" });
      expect(result.success).toBe(true);
    });

    it("rejects missing content field", () => {
      const result = chatMessageSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
