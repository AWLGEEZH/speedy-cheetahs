import { describe, it, expect, vi, beforeEach } from "vitest";

// Set AUTH_SECRET before any module that needs it
vi.hoisted(() => {
  process.env.AUTH_SECRET =
    "ba40dd10c1fa54a7651e1a28f1d9aff1a768aed36723f5027fb3071c7df250ae";
});

import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/email";

// ─── RATE LIMITER ─────────────────────────────────────

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Reset rate limiter between tests by using unique keys
  });

  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result1 = rateLimit(key, 3, 60_000);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = rateLimit(key, 3, 60_000);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = rateLimit(key, 3, 60_000);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);

    const result = rateLimit(key, 2, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const key = `test-reset-${Date.now()}`;
    rateLimit(key, 1, 1); // 1ms window
    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 5) {
      // spin
    }
    const result = rateLimit(key, 1, 1);
    expect(result.success).toBe(true);
  });

  it("uses separate buckets for different keys", () => {
    const key1 = `test-bucket1-${Date.now()}`;
    const key2 = `test-bucket2-${Date.now()}`;

    rateLimit(key1, 1, 60_000);
    const blocked = rateLimit(key1, 1, 60_000);
    expect(blocked.success).toBe(false);

    const allowed = rateLimit(key2, 1, 60_000);
    expect(allowed.success).toBe(true);
  });

  it("returns correct remaining count", () => {
    const key = `test-remaining-${Date.now()}`;
    const r1 = rateLimit(key, 5, 60_000);
    expect(r1.remaining).toBe(4);

    const r2 = rateLimit(key, 5, 60_000);
    expect(r2.remaining).toBe(3);

    const r3 = rateLimit(key, 5, 60_000);
    expect(r3.remaining).toBe(2);
  });
});

// ─── HTML ESCAPING ────────────────────────────────────

describe("Email HTML Escaping", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('He said "hello"')).toBe(
      "He said &quot;hello&quot;"
    );
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("It's fine")).toBe("It&#039;s fine");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("prevents HTML injection in subject line", () => {
    const maliciousSubject =
      '<img src=x onerror="document.location=\'https://evil.com\'"/>';
    const escaped = escapeHtml(maliciousSubject);
    // HTML tags are fully escaped — no executable markup
    expect(escaped).not.toContain("<img");
    expect(escaped).not.toContain("<");
    expect(escaped).not.toContain(">");
    expect(escaped).toContain("&lt;img");
    expect(escaped).toContain("&gt;");
  });
});

// ─── SSRF PROTECTION ──────────────────────────────────

describe("SSRF Protection — URL Validation", () => {
  // We test the validateUrl function indirectly through extractTextFromUrl
  // since validateUrl is not exported. We just verify it throws for bad URLs.

  it("rejects private IP 10.x.x.x", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://10.0.0.1/admin")
    ).rejects.toThrow("Private IP addresses are not allowed");
  });

  it("rejects private IP 192.168.x.x", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://192.168.1.1/")
    ).rejects.toThrow("Private IP addresses are not allowed");
  });

  it("rejects private IP 172.16-31.x.x", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://172.16.0.1/")
    ).rejects.toThrow("Private IP addresses are not allowed");
  });

  it("rejects localhost", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://localhost/secret")
    ).rejects.toThrow("Local addresses are not allowed");
  });

  it("rejects 127.0.0.1", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://127.0.0.1/secret")
    ).rejects.toThrow("Local addresses are not allowed");
  });

  it("rejects AWS metadata endpoint", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://169.254.169.254/latest/meta-data/")
    ).rejects.toThrow("Metadata endpoints are not allowed");
  });

  it("rejects Google metadata endpoint", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("http://metadata.google.internal/")
    ).rejects.toThrow("Metadata endpoints are not allowed");
  });

  it("rejects non-HTTP protocols", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("file:///etc/passwd")
    ).rejects.toThrow("Only HTTP and HTTPS URLs are allowed");
  });

  it("rejects ftp protocol", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("ftp://evil.com/file")
    ).rejects.toThrow("Only HTTP and HTTPS URLs are allowed");
  });

  it("rejects invalid URLs", async () => {
    const { extractTextFromUrl } = await import("@/lib/extract");
    await expect(
      extractTextFromUrl("not-a-url")
    ).rejects.toThrow("Invalid URL");
  });
});

// ─── PASSWORD RESET TOKEN INVALIDATION ────────────────

describe("Password Reset Token — Single Use", () => {
  it("creates reset tokens with JTI claim", async () => {
    const { createResetToken } = await import("@/lib/auth");
    const token = await createResetToken("coach_123");
    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    expect(payload.jti).toBeDefined();
    expect(typeof payload.jti).toBe("string");
  });

  it("generates unique JTIs for different tokens", async () => {
    const { createResetToken } = await import("@/lib/auth");
    const token1 = await createResetToken("coach_123");
    const token2 = await createResetToken("coach_123");
    const payload1 = JSON.parse(
      Buffer.from(token1.split(".")[1], "base64url").toString()
    );
    const payload2 = JSON.parse(
      Buffer.from(token2.split(".")[1], "base64url").toString()
    );
    expect(payload1.jti).not.toBe(payload2.jti);
  });

  it("verifies a valid unused reset token", async () => {
    const { createResetToken, verifyResetToken } = await import(
      "@/lib/auth"
    );
    const token = await createResetToken("coach_456");
    const result = await verifyResetToken(token);
    expect(result).not.toBeNull();
    expect(result?.coachId).toBe("coach_456");
  });

  it("rejects a used reset token after invalidation", async () => {
    const { createResetToken, verifyResetToken, invalidateResetToken } =
      await import("@/lib/auth");
    const token = await createResetToken("coach_789");

    // First use should work
    const firstUse = await verifyResetToken(token);
    expect(firstUse).not.toBeNull();

    // Invalidate the token
    invalidateResetToken(token);

    // Second use should fail
    const secondUse = await verifyResetToken(token);
    expect(secondUse).toBeNull();
  });
});
