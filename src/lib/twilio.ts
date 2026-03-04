import twilio from "twilio";

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  return twilio(accountSid, authToken);
}

export async function sendBulkSms(
  phoneNumbers: string[],
  message: string
): Promise<{ sent: number; failed: number }> {
  const client = getClient();
  const from =
    process.env.TWILIO_MESSAGING_SERVICE_SID ||
    process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("Twilio sender not configured");
  }

  const results = await Promise.allSettled(
    phoneNumbers.map((to) =>
      client.messages.create({
        to,
        ...(process.env.TWILIO_MESSAGING_SERVICE_SID
          ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
          : { from: process.env.TWILIO_PHONE_NUMBER }),
        body: `[Speedy Cheetahs] ${message}`,
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

  await client.messages.create({
    to,
    ...(process.env.TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
      : { from: process.env.TWILIO_PHONE_NUMBER }),
    body: `[Speedy Cheetahs] ${message}`,
  });
}
