import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("Email credentials not configured (SMTP_USER, SMTP_PASS)");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
}

export async function sendBulkEmail(
  emails: string[],
  subject: string,
  message: string
): Promise<{ sent: number; failed: number }> {
  const transporter = getTransporter();
  const from = `"3D Printed Diamonds" <${process.env.SMTP_USER}>`;

  const results = await Promise.allSettled(
    emails.map((to) =>
      transporter.sendMail({
        from,
        to,
        subject: `[3DP Diamonds] ${subject}`,
        text: `${message}\n\n---\n3D Printed Diamonds Farm-1\nYou received this because you opted in to email notifications.\nTo unsubscribe, update your preferences at your team registration page.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a365d; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">💎 3D Printed Diamonds</h2>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <h3 style="margin: 0 0 12px 0; color: #1a365d;">${subject}</h3>
              <p style="margin: 0; color: #4a5568; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
              <p style="font-size: 12px; color: #a0aec0; margin: 0;">
                3D Printed Diamonds Farm-1<br/>
                You received this because you opted in to email notifications.<br/>
                To unsubscribe, update your preferences on the team registration page.
              </p>
            </div>
          </div>
        `,
      })
    )
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

export async function sendSingleEmail(
  to: string,
  subject: string,
  message: string
): Promise<{ messageId: string }> {
  const transporter = getTransporter();
  const from = `"3D Printed Diamonds" <${process.env.SMTP_USER}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject: `[3DP Diamonds] ${subject}`,
    text: message,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a365d; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">💎 3D Printed Diamonds</h2>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #4a5568; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  });

  return { messageId: info.messageId };
}
