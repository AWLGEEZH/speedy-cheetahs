# Speedy Cheetahs — Backlog

Planned features and improvements for the team portal.

---

## Backlog Items

### 1. Progressive Web App (PWA)

**Priority:** Medium
**Effort:** ~1.5 hours

Convert the portal into an installable mobile app experience.

**Scope:**
- Add `manifest.json` with app name, icons, theme colors, display mode
- Add service worker for asset caching and offline shell
- Add iOS and Android install prompt meta tags
- Generate app icon sizes from team logo
- Custom splash screen with Cheetah branding
- Full-screen mode (hides browser URL bar and chrome)

**Benefits:**
- Parents and coaches get an app icon on their phone home screen
- Faster page loads on repeat visits (cached assets)
- Feels like a native app without app store distribution
- Branded offline screen instead of browser error page

---

### 2. Photo Upload & Sharing

**Priority:** Medium
**Effort:** ~5 hours

Add the ability to upload, organize, and share team photos.

**Scope:**
- Image storage via Cloudflare R2 (free tier, S3-compatible)
- Photo upload API with resize and compression
- Photo gallery page with grid view and lightbox
- Album/event grouping (organize by game or practice)
- Upload UI with drag-and-drop or camera button, multi-file support
- Access control (coaches upload, parents view — or both)
- Thumbnail generation for fast gallery loading
- DB schema: Photos table (url, caption, uploadedBy, eventId, createdAt)

**Optional add-ons:**
- Parent uploads (not just coaches) — +30 min
- Captions and comments — +45 min
- Download original / shareable link — +30 min
- Auto-link photos to game day events — +30 min

**Privacy considerations:**
- Gallery restricted to authenticated users (coaches + registered parents)
- No public gallery without explicit opt-in
- Parent opt-out option for photos of their child

---

### 3. Volunteer Reminder Notifications

**Priority:** Medium
**Effort:** ~3 hours

Automated SMS and email reminders to parents who have signed up for volunteer roles.

**Reminders:**
- **24 hours before** the event — advance notice
- **90 minutes before** the event — heads-up reminder

**Scope:**
- Add `reminder24hSent` and `reminder90mSent` fields to VolunteerSignup schema
- Create `/api/cron/volunteer-reminders` endpoint with secret-key auth
- Query upcoming events, find volunteer signups, send SMS/email via existing Twilio + Nodemailer
- Mark reminders as sent to prevent duplicates
- Skip cancelled events
- Set up external cron (cron-job.org, free) to hit endpoint every 15 minutes

**Message examples:**
- 24hr: "[Speedy Cheetahs] Reminder: You're volunteering as Scoreboard Operator tomorrow at 10:00 AM at Lions Park."
- 90min: "[Speedy Cheetahs] Heads up! You're volunteering as Scoreboard Operator in 90 minutes at Lions Park."

**Dependencies:**
- Existing SMS (Twilio) and email (Nodemailer) infrastructure — already built
- External cron service (cron-job.org — free tier) or Railway cron
- `CRON_SECRET` environment variable for endpoint security

---

## Completed

_Items moved here after implementation._

_(none yet)_

---

*Last updated: March 2026*
