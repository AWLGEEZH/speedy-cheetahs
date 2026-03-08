import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/twilio";
import { sendBulkEmail } from "@/lib/email";
import { format } from "date-fns";

/**
 * GET /api/cron/volunteer-reminders?secret=xxx
 *
 * Called by an external cron service every 15 minutes.
 * Sends two types of reminders to volunteers:
 *   - 24 hours before the event
 *   - 90 minutes before the event
 */
export async function GET(request: Request) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { reminders24h: { sms: 0, email: 0 }, reminders90m: { sms: 0, email: 0 }, errors: [] as string[] };

  try {
    // ── 24-HOUR REMINDERS ──────────────────────────────────
    // Find events starting between 23.5 and 24.5 hours from now
    const h24Min = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const h24Max = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    const signups24h = await prisma.volunteerSignup.findMany({
      where: {
        reminder24hSent: false,
        role: {
          event: {
            date: { gte: h24Min, lte: h24Max },
            isCancelled: false,
          },
        },
      },
      include: {
        family: { include: { contacts: true } },
        role: {
          include: {
            event: true,
          },
        },
      },
    });

    for (const signup of signups24h) {
      const { family, role } = signup;
      const event = role.event;
      const eventTime = format(new Date(event.date), "h:mm a");
      const eventDate = format(new Date(event.date), "EEEE, MMM d");

      const message = `Reminder: You're volunteering as ${role.name} tomorrow (${eventDate}) at ${eventTime} at ${event.locationName}. Thank you!`;

      try {
        // Collect all phones (primary + additional contacts)
        if (family.smsOptIn) {
          const phones: string[] = [family.phone];
          for (const c of family.contacts) {
            if (c.phone) phones.push(c.phone);
          }
          await sendBulkSms(phones, message);
          results.reminders24h.sms += phones.length;
        }

        // Collect all emails (primary + additional contacts)
        if (family.emailOptIn) {
          const emails: string[] = [];
          if (family.email) emails.push(family.email);
          for (const c of family.contacts) {
            if (c.email) emails.push(c.email);
          }
          if (emails.length > 0) {
            await sendBulkEmail(emails, "Volunteer Reminder — Tomorrow", message);
            results.reminders24h.email += emails.length;
          }
        }

        // Mark as sent
        await prisma.volunteerSignup.update({
          where: { id: signup.id },
          data: { reminder24hSent: true },
        });
      } catch (err) {
        results.errors.push(`24h reminder failed for signup ${signup.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // ── 90-MINUTE REMINDERS ────────────────────────────────
    // Find events starting between 75 and 105 minutes from now
    const m90Min = new Date(now.getTime() + 75 * 60 * 1000);
    const m90Max = new Date(now.getTime() + 105 * 60 * 1000);

    const signups90m = await prisma.volunteerSignup.findMany({
      where: {
        reminder90mSent: false,
        role: {
          event: {
            date: { gte: m90Min, lte: m90Max },
            isCancelled: false,
          },
        },
      },
      include: {
        family: { include: { contacts: true } },
        role: {
          include: {
            event: true,
          },
        },
      },
    });

    for (const signup of signups90m) {
      const { family, role } = signup;
      const event = role.event;
      const eventTime = format(new Date(event.date), "h:mm a");

      const message = `Heads up! You're volunteering as ${role.name} in 90 minutes (${eventTime}) at ${event.locationName}. See you there!`;

      try {
        // Collect all phones (primary + additional contacts)
        if (family.smsOptIn) {
          const phones: string[] = [family.phone];
          for (const c of family.contacts) {
            if (c.phone) phones.push(c.phone);
          }
          await sendBulkSms(phones, message);
          results.reminders90m.sms += phones.length;
        }

        // Collect all emails (primary + additional contacts)
        if (family.emailOptIn) {
          const emails: string[] = [];
          if (family.email) emails.push(family.email);
          for (const c of family.contacts) {
            if (c.email) emails.push(c.email);
          }
          if (emails.length > 0) {
            await sendBulkEmail(emails, "Volunteer Reminder — Starting Soon", message);
            results.reminders90m.email += emails.length;
          }
        }

        // Mark as sent
        await prisma.volunteerSignup.update({
          where: { id: signup.id },
          data: { reminder90mSent: true },
        });
      } catch (err) {
        results.errors.push(`90m reminder failed for signup ${signup.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  } catch (err) {
    results.errors.push(`Global error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    ...results,
  });
}
