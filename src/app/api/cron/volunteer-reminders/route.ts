import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkSms } from "@/lib/twilio";
import { sendBulkEmail } from "@/lib/email";
import { normalizePhone, formatTime, formatDate } from "@/lib/utils";

/**
 * GET /api/cron/volunteer-reminders?secret=xxx
 *
 * Called by an external cron service every 15 minutes.
 * Sends two types of reminders to volunteers:
 *   - 24 hours before the event
 *   - 90 minutes before the event
 *
 * Groups signups by family+event so a family signed up for multiple
 * roles at the same event only receives ONE reminder listing all roles.
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

    // Group signups by family+event to send one message per family per event
    const grouped24h = new Map<string, typeof signups24h>();
    for (const signup of signups24h) {
      const key = `${signup.familyId}:${signup.role.event.id}`;
      const group = grouped24h.get(key) ?? [];
      group.push(signup);
      grouped24h.set(key, group);
    }

    for (const [, groupSignups] of grouped24h) {
      const { family } = groupSignups[0];
      const event = groupSignups[0].role.event;
      const roleNames = groupSignups.map((s) => s.role.name).join(" and ");
      const eventTime = formatTime(event.date);
      const eventDate = formatDate(event.date);

      const message = `Reminder: You're volunteering as ${roleNames} tomorrow (${eventDate}) at ${eventTime} at ${event.locationName}. Thank you!`;

      try {
        // Collect all phones (primary + additional contacts), deduplicated
        if (family.smsOptIn) {
          const phoneSet = new Set<string>();
          phoneSet.add(normalizePhone(family.phone));
          for (const c of family.contacts) {
            if (c.phone) phoneSet.add(normalizePhone(c.phone));
          }
          const phones = [...phoneSet];
          await sendBulkSms(phones, message);
          results.reminders24h.sms += phones.length;
        }

        // Collect all emails (primary + additional contacts), deduplicated
        if (family.emailOptIn) {
          const emailSet = new Set<string>();
          if (family.email) emailSet.add(family.email.toLowerCase().trim());
          for (const c of family.contacts) {
            if (c.email) emailSet.add(c.email.toLowerCase().trim());
          }
          const emails = [...emailSet];
          if (emails.length > 0) {
            await sendBulkEmail(emails, "Volunteer Reminder — Tomorrow", message);
            results.reminders24h.email += emails.length;
          }
        }

        // Mark ALL signups in this group as sent
        await prisma.volunteerSignup.updateMany({
          where: { id: { in: groupSignups.map((s) => s.id) } },
          data: { reminder24hSent: true },
        });
      } catch (err) {
        results.errors.push(`24h reminder failed for family ${family.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
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

    // Group signups by family+event to send one message per family per event
    const grouped90m = new Map<string, typeof signups90m>();
    for (const signup of signups90m) {
      const key = `${signup.familyId}:${signup.role.event.id}`;
      const group = grouped90m.get(key) ?? [];
      group.push(signup);
      grouped90m.set(key, group);
    }

    for (const [, groupSignups] of grouped90m) {
      const { family } = groupSignups[0];
      const event = groupSignups[0].role.event;
      const roleNames = groupSignups.map((s) => s.role.name).join(" and ");
      const eventTime = formatTime(event.date);

      const message = `Heads up! You're volunteering as ${roleNames} in 90 minutes (${eventTime}) at ${event.locationName}. See you there!`;

      try {
        // Collect all phones (primary + additional contacts), deduplicated
        if (family.smsOptIn) {
          const phoneSet = new Set<string>();
          phoneSet.add(normalizePhone(family.phone));
          for (const c of family.contacts) {
            if (c.phone) phoneSet.add(normalizePhone(c.phone));
          }
          const phones = [...phoneSet];
          await sendBulkSms(phones, message);
          results.reminders90m.sms += phones.length;
        }

        // Collect all emails (primary + additional contacts), deduplicated
        if (family.emailOptIn) {
          const emailSet = new Set<string>();
          if (family.email) emailSet.add(family.email.toLowerCase().trim());
          for (const c of family.contacts) {
            if (c.email) emailSet.add(c.email.toLowerCase().trim());
          }
          const emails = [...emailSet];
          if (emails.length > 0) {
            await sendBulkEmail(emails, "Volunteer Reminder — Starting Soon", message);
            results.reminders90m.email += emails.length;
          }
        }

        // Mark ALL signups in this group as sent
        await prisma.volunteerSignup.updateMany({
          where: { id: { in: groupSignups.map((s) => s.id) } },
          data: { reminder90mSent: true },
        });
      } catch (err) {
        results.errors.push(`90m reminder failed for family ${family.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
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
