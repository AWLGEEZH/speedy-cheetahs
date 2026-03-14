import { describe, it, expect } from "vitest";
import { postUpdateSchema, updateUpdateSchema } from "@/lib/validators";

describe("postUpdateSchema — imageUrl field", () => {
  const validBase = {
    title: "Practice Cancelled",
    message: "Tomorrow's practice is cancelled due to rain.",
  };

  it("accepts update without imageUrl", () => {
    const result = postUpdateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts update with valid imageUrl", () => {
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "https://i.imgur.com/abc123.jpg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBe("https://i.imgur.com/abc123.jpg");
    }
  });

  it("accepts update with empty string imageUrl (clears image)", () => {
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL format", () => {
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects imageUrl over 2048 characters", () => {
    const longUrl = "https://example.com/" + "a".repeat(2030);
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: longUrl,
    });
    expect(result.success).toBe(false);
  });

  it("accepts imageUrl at 2048 characters", () => {
    // Build a URL that's exactly 2048 chars
    const base = "https://example.com/";
    const padded = base + "a".repeat(2048 - base.length);
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: padded,
    });
    expect(result.success).toBe(true);
  });

  it("accepts https URLs", () => {
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "https://i.imgur.com/photo.png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts http URLs", () => {
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "http://example.com/photo.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("preserves other fields alongside imageUrl", () => {
    const result = postUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "https://i.imgur.com/abc.jpg",
      sendSms: true,
      sendEmail: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(validBase.title);
      expect(result.data.message).toBe(validBase.message);
      expect(result.data.imageUrl).toBe("https://i.imgur.com/abc.jpg");
      expect(result.data.sendSms).toBe(true);
      expect(result.data.sendEmail).toBe(false);
    }
  });
});

describe("updateUpdateSchema — imageUrl field", () => {
  const validBase = {
    title: "Updated Title",
    message: "Updated message content.",
  };

  it("accepts edit without imageUrl", () => {
    const result = updateUpdateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts edit with valid imageUrl", () => {
    const result = updateUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "https://i.imgur.com/updated.jpg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBe("https://i.imgur.com/updated.jpg");
    }
  });

  it("accepts edit with empty string imageUrl (removes image)", () => {
    const result = updateUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL format on edit", () => {
    const result = updateUpdateSchema.safeParse({
      ...validBase,
      imageUrl: "just some text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects imageUrl over 2048 characters on edit", () => {
    const longUrl = "https://example.com/" + "a".repeat(2030);
    const result = updateUpdateSchema.safeParse({
      ...validBase,
      imageUrl: longUrl,
    });
    expect(result.success).toBe(false);
  });
});
