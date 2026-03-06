import { describe, it, expect } from "vitest";
import {
  createFamilySchema,
  updateFamilySchema,
  publicFamilyUpdateSchema,
  postUpdateSchema,
} from "@/lib/validators";

describe("Validator Schemas - Email Fields", () => {
  describe("createFamilySchema", () => {
    it("accepts emailOptIn field", () => {
      const result = createFamilySchema.safeParse({
        parentName: "Jane Doe",
        phone: "5551234567",
        emailOptIn: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailOptIn).toBe(true);
      }
    });

    it("defaults emailOptIn to undefined when not provided", () => {
      const result = createFamilySchema.safeParse({
        parentName: "Jane Doe",
        phone: "5551234567",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailOptIn).toBeUndefined();
      }
    });
  });

  describe("updateFamilySchema", () => {
    it("accepts emailOptIn as optional field", () => {
      const result = updateFamilySchema.safeParse({
        emailOptIn: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailOptIn).toBe(false);
      }
    });

    it("accepts both smsOptIn and emailOptIn together", () => {
      const result = updateFamilySchema.safeParse({
        smsOptIn: true,
        emailOptIn: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.smsOptIn).toBe(true);
        expect(result.data.emailOptIn).toBe(true);
      }
    });
  });

  describe("publicFamilyUpdateSchema", () => {
    it("accepts emailOptIn from the parent registration page", () => {
      const result = publicFamilyUpdateSchema.safeParse({
        parentName: "John Smith",
        email: "john@example.com",
        phone: "5551234567",
        smsOptIn: true,
        emailOptIn: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailOptIn).toBe(true);
      }
    });

    it("rejects non-boolean emailOptIn", () => {
      const result = publicFamilyUpdateSchema.safeParse({
        emailOptIn: "yes",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("postUpdateSchema", () => {
    it("accepts sendEmail field", () => {
      const result = postUpdateSchema.safeParse({
        title: "Practice Update",
        message: "Practice is moved to 5pm",
        sendSms: true,
        sendEmail: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendEmail).toBe(true);
        expect(result.data.sendSms).toBe(true);
      }
    });

    it("defaults sendEmail to false", () => {
      const result = postUpdateSchema.safeParse({
        title: "Test",
        message: "Test message",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendEmail).toBe(false);
        expect(result.data.sendSms).toBe(false);
      }
    });

    it("allows sending only email without SMS", () => {
      const result = postUpdateSchema.safeParse({
        title: "Email Only Update",
        message: "This goes via email only",
        sendSms: false,
        sendEmail: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sendEmail).toBe(true);
        expect(result.data.sendSms).toBe(false);
      }
    });
  });
});
