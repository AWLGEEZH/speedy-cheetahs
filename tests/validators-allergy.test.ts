import { describe, it, expect } from "vitest";
import { eventAllergySchema } from "@/lib/validators";

describe("eventAllergySchema", () => {
  const validData = {
    eventId: "cmmd3pvkk0001phkqfgt84a65",
    familyId: "cmmd4abc1234family5678",
    allergies: "Peanut allergy",
  };

  it("accepts valid allergy data", () => {
    const result = eventAllergySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventId).toBe(validData.eventId);
      expect(result.data.familyId).toBe(validData.familyId);
      expect(result.data.allergies).toBe(validData.allergies);
    }
  });

  it("accepts allergies with multiple items", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: "Peanut allergy, gluten-free, dairy-free",
    });
    expect(result.success).toBe(true);
  });

  it("accepts allergies at exactly 1 character", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: "x",
    });
    expect(result.success).toBe(true);
  });

  it("accepts allergies at exactly 500 characters", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("rejects allergies over 500 characters", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty allergies string", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing eventId", () => {
    const { eventId: _, ...rest } = validData;
    const result = eventAllergySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing familyId", () => {
    const { familyId: _, ...rest } = validData;
    const result = eventAllergySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing allergies field", () => {
    const { allergies: _, ...rest } = validData;
    const result = eventAllergySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = eventAllergySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string eventId", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      eventId: 123,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string familyId", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      familyId: 456,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string allergies", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: 789,
    });
    expect(result.success).toBe(false);
  });

  it("accepts allergies with special characters", () => {
    const result = eventAllergySchema.safeParse({
      ...validData,
      allergies: "Tree nuts (walnuts, pecans) & shellfish — severe!",
    });
    expect(result.success).toBe(true);
  });

  it("strips no fields (no .strip() or .transform())", () => {
    const result = eventAllergySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).toHaveLength(3);
    }
  });
});
