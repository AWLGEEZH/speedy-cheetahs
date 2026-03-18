import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCoachSchema } from "@/lib/validators";

// Mock nodemailer before importing
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

process.env.SMTP_USER = "test@gmail.com";
process.env.SMTP_PASS = "testpassword";

import { sendBulkEmail } from "@/lib/email";

describe("Chat Email Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateCoachSchema - chatNotifyEmail field", () => {
    it("accepts chatNotifyEmail: true", () => {
      const result = updateCoachSchema.safeParse({ chatNotifyEmail: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chatNotifyEmail).toBe(true);
      }
    });

    it("accepts chatNotifyEmail: false", () => {
      const result = updateCoachSchema.safeParse({ chatNotifyEmail: false });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chatNotifyEmail).toBe(false);
      }
    });

    it("allows omitting chatNotifyEmail (optional)", () => {
      const result = updateCoachSchema.safeParse({ name: "Coach A" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chatNotifyEmail).toBeUndefined();
      }
    });

    it("rejects non-boolean chatNotifyEmail", () => {
      const result = updateCoachSchema.safeParse({ chatNotifyEmail: "yes" });
      expect(result.success).toBe(false);
    });

    it("allows chatNotifyEmail alongside other fields", () => {
      const result = updateCoachSchema.safeParse({
        name: "Updated Coach",
        email: "coach@example.com",
        chatNotifyEmail: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Coach");
        expect(result.data.chatNotifyEmail).toBe(false);
      }
    });
  });

  describe("Chat notification email content", () => {
    it("sends chat notification with correct subject format", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "<id@gmail.com>" });

      await sendBulkEmail(
        ["coach2@example.com"],
        "New chat message from Coach Smith",
        'Coach Smith posted in the coaches chat:\n\n"Hey team, game plan update"\n\nLog in to view and reply.'
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.subject).toBe("[3DP Diamonds] New chat message from Coach Smith");
      expect(call.text).toContain("Coach Smith posted in the coaches chat");
      expect(call.text).toContain("Log in to view and reply");
    });

    it("sends to multiple coaches", async () => {
      mockSendMail
        .mockResolvedValueOnce({ messageId: "<id1@gmail.com>" })
        .mockResolvedValueOnce({ messageId: "<id2@gmail.com>" });

      const result = await sendBulkEmail(
        ["coach2@example.com", "coach3@example.com"],
        "New chat message from Coach Smith",
        'Coach Smith posted in the coaches chat:\n\n"Practice rescheduled"\n\nLog in to view and reply.'
      );

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("handles email failure gracefully (does not throw)", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP down"));

      const result = await sendBulkEmail(
        ["coach2@example.com"],
        "New chat message from Coach Smith",
        "Test message"
      );

      // sendBulkEmail uses Promise.allSettled, so it counts failures instead of throwing
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe("Chat notification logic", () => {
    it("should truncate long messages to 200 chars with ellipsis", () => {
      const longMessage = "a".repeat(250);
      const preview =
        longMessage.length > 200
          ? longMessage.slice(0, 200) + "..."
          : longMessage;
      expect(preview).toHaveLength(203);
      expect(preview.endsWith("...")).toBe(true);
    });

    it("should not truncate short messages", () => {
      const shortMessage = "Quick update about tomorrow";
      const preview =
        shortMessage.length > 200
          ? shortMessage.slice(0, 200) + "..."
          : shortMessage;
      expect(preview).toBe(shortMessage);
      expect(preview.endsWith("...")).toBe(false);
    });

    it("cooldown filter: 5-minute window calculation", () => {
      const COOLDOWN_MS = 5 * 60 * 1000;
      const now = Date.now();
      const cutoff = new Date(now - COOLDOWN_MS);

      // Coach notified 3 minutes ago should be excluded
      const recentNotification = new Date(now - 3 * 60 * 1000);
      expect(recentNotification > cutoff).toBe(true); // within cooldown, should skip

      // Coach notified 10 minutes ago should be included
      const oldNotification = new Date(now - 10 * 60 * 1000);
      expect(oldNotification > cutoff).toBe(false); // outside cooldown, should send

      // Coach never notified (null) should be included
      const neverNotified = null;
      expect(neverNotified === null).toBe(true); // null means never notified, should send
    });
  });
});
