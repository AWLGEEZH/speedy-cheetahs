import twilio from "twilio";

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  return twilio(accountSid, authToken);
}

/** Normalize a phone number to E.164 format (+1XXXXXXXXXX) */
function normalizePhone(raw: string): string {
  const digits = raw.trim().replace(/[^\d]/g, "");
  return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
}

function getSenderConfig(): { from: string } | { messagingServiceSid: string } {
  const msid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (msid) {
    return { messagingServiceSid: msid };
  }

  const phone = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!phone) {
    throw new Error("Twilio sender not configured");
  }

  return { from: normalizePhone(phone) };
}

export async function sendBulkSms(
  phoneNumbers: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  const client = getClient();
  const sender = getSenderConfig();

  const results = await Promise.allSettled(
    phoneNumbers.map((to) =>
      client.messages.create({
        to,
        ...sender,
        body: `[3DP Diamonds] ${message}`,
      })
    )
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

export async function sendSingleSms(
  to: string,
  message: string
): Promise<void> {
  const client = getClient();
  const sender = getSenderConfig();

  await client.messages.create({
    to,
    ...sender,
    body: `[3DP Diamonds] ${message}`,
  });
}
