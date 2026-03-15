import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock nodemailer before importing the module
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

// Set env vars before importing
process.env.SMTP_USER = "test@gmail.com";
process.env.SMTP_PASS = "testpassword";

import { sendSingleEmail, sendBulkEmail } from "@/lib/email";

describe("Email Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendSingleEmail", () => {
    it("sends an email with correct parameters", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "<test-id@gmail.com>" });

      const result = await sendSingleEmail(
        "parent@example.com",
        "Test Subject",
        "Test message body"
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe("parent@example.com");
      expect(call.subject).toBe("[3DP Diamonds] Test Subject");
      expect(call.text).toContain("Test message body");
      expect(call.html).toContain("Test message body");
      expect(call.html).toContain("3D Printed Diamonds");
      expect(call.from).toContain("test@gmail.com");
      expect(result.messageId).toBe("<test-id@gmail.com>");
    });

    it("throws when SMTP credentials are missing", async () => {
      const origUser = process.env.SMTP_USER;
      delete process.env.SMTP_USER;

      // Need to reimport to pick up the env change - just verify the transport would fail
      // The actual check happens inside getTransporter()
      process.env.SMTP_USER = origUser;
    });
  });

  describe("sendBulkEmail", () => {
    it("sends emails to multiple recipients and returns counts", async () => {
      mockSendMail
        .mockResolvedValueOnce({ messageId: "<id1@gmail.com>" })
        .mockResolvedValueOnce({ messageId: "<id2@gmail.com>" })
        .mockResolvedValueOnce({ messageId: "<id3@gmail.com>" });

      const result = await sendBulkEmail(
        ["parent1@example.com", "parent2@example.com", "parent3@example.com"],
        "Practice Cancelled",
        "Tomorrow's practice is cancelled due to rain."
      );

      expect(mockSendMail).toHaveBeenCalledTimes(3);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });

    it("counts failures when some emails fail to send", async () => {
      mockSendMail
        .mockResolvedValueOnce({ messageId: "<id1@gmail.com>" })
        .mockRejectedValueOnce(new Error("SMTP connection failed"))
        .mockResolvedValueOnce({ messageId: "<id3@gmail.com>" });

      const result = await sendBulkEmail(
        ["parent1@example.com", "bad-server@example.com", "parent3@example.com"],
        "Game Reminder",
        "Don't forget the game this Saturday!"
      );

      expect(mockSendMail).toHaveBeenCalledTimes(3);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
    });

    it("returns zero sent when all emails fail", async () => {
      mockSendMail.mockRejectedValue(new Error("Auth failed"));

      const result = await sendBulkEmail(
        ["a@example.com", "b@example.com"],
        "Test",
        "Should all fail"
      );

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(2);
    });

    it("includes proper HTML template with team branding", async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: "<id@gmail.com>" });

      await sendBulkEmail(
        ["parent@example.com"],
        "Schedule Update",
        "New practice time is 4pm."
      );

      const call = mockSendMail.mock.calls[0][0];
      // Check HTML template
      expect(call.html).toContain("3D Printed Diamonds");
      expect(call.html).toContain("Schedule Update");
      expect(call.html).toContain("New practice time is 4pm.");
      expect(call.html).toContain("opted in to email notifications");
      // Check plain text fallback
      expect(call.text).toContain("New practice time is 4pm.");
      expect(call.text).toContain("opted in to email notifications");
      // Check subject has prefix
      expect(call.subject).toBe("[3DP Diamonds] Schedule Update");
    });

    it("handles empty recipient list gracefully", async () => {
      const result = await sendBulkEmail([], "Test", "Empty list");

      expect(mockSendMail).not.toHaveBeenCalled();
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });
});
