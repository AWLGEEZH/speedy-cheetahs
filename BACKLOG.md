# Speedy Cheetahs — Backlog

Planned features and improvements for the team portal.

---

## Backlog Items

### 1. Photo Upload & Sharing

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

---

## Completed

### ~~PWA (Progressive Web App)~~ ✅

**Completed:** March 2026

Installable app experience with manifest, service worker, offline page, app icons, and full-screen standalone mode.

---

### ~~Volunteer Reminder Notifications~~ ✅

**Completed:** March 2026

Automated SMS and email reminders to volunteer parents — 24 hours and 90 minutes before events. Cron endpoint at `/api/cron/volunteer-reminders` secured with `CRON_SECRET`. Requires external cron service (cron-job.org) to hit endpoint every 15 minutes.

---

*Last updated: March 2026*
