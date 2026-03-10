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

### 2. Dashboard Visual Upgrade

**Priority:** Medium
**Effort:** ~2-4 hours

Redesign dashboard with better visual hierarchy, gradient cards, and data visualizations.

**Scope:**
- Gradient stat cards with subtle shadows
- Icon illustrations for each tile
- Attendance trend chart (simple line/bar chart over recent games)
- Better layout and spacing
- Quick-action buttons with improved visual weight

---

### 3. Pull-to-Refresh on Mobile

**Priority:** Medium
**Effort:** ~2-4 hours

Add native-feeling pull-to-refresh on key PWA pages.

**Scope:**
- Schedule page pull-to-refresh
- Updates page pull-to-refresh
- Game Day page pull-to-refresh
- Visual pull indicator with team branding
- Touch gesture handling for iOS and Android

---

### 4. Dark Mode

**Priority:** Medium
**Effort:** ~2-4 hours

Add a dark mode toggle with full theme support across all pages.

**Scope:**
- Dark color palette (dark backgrounds, light text)
- Theme toggle in nav bar or settings
- Persist preference in localStorage
- Respect `prefers-color-scheme` system setting
- Update all components for dark compatibility
- PWA theme color switching

---

### 5. Haptic-Style Feedback & Celebrations

**Priority:** Medium
**Effort:** ~2-4 hours

Add delightful micro-interactions and visual feedback throughout the app.

**Scope:**
- Success checkmark animation after RSVP
- Confetti or celebration animation on game completion
- Subtle button press animations
- Visual feedback on toggle interactions (attendance, volunteer sign-up)
- Sound-optional game day interactions

---

### 6. Real-Time Updates via Server-Sent Events

**Priority:** Low
**Effort:** ~3-4 hours

Replace 10-second polling with Server-Sent Events for instant live updates during games.

**Scope:**
- SSE endpoint for Game Day attendance/fielding/batting
- Client-side EventSource connection with auto-reconnect
- Instant attendance updates across all connected coaches
- Live scoreboard feel during games
- Fallback to polling if SSE connection drops

---

### 7. Parent Onboarding Flow

**Priority:** Low
**Effort:** ~3-4 hours

Guided walkthrough for new parents visiting the portal for the first time.

**Scope:**
- 3-step wizard: Register → RSVP → Volunteer
- Progress indicator (step 1 of 3)
- Contextual tips and explanations
- Skip option for returning parents
- localStorage flag to show only once
- Mobile-optimized card-based flow

---

---

## Completed

### ~~UX Polish Bundle (Animations, Colors, Logo, Skeletons)~~ ✅

**Completed:** March 2026

Micro-animations (fade-in, slide-down, scale-in), button press feedback, toast slide-in animation, hero gradient on home/offline pages, dashboard stat card accents with icon circles, darker body text, SVG team logo component replacing emoji across nav/home/offline, regenerated PWA icons, and shimmer skeleton loading on Schedule, Dashboard, Updates, Roster, and Game Day pages.

---

### ~~RSVP + Game Day Enhancements~~ ✅

**Completed:** March 2026

Family-filtered RSVP page (phone lookup → show only your players), RSVP count badges on schedule, RSVP→Game Day attendance auto-sync, 6 outs per inning tracking with auto-advance, and auto-assign fielding positions for confirmed players with rotation.

---

### ~~PWA (Progressive Web App)~~ ✅

**Completed:** March 2026

Installable app experience with manifest, service worker, offline page, app icons, and full-screen standalone mode.

---

### ~~Volunteer Reminder Notifications~~ ✅

**Completed:** March 2026

Automated SMS and email reminders to volunteer parents — 24 hours and 90 minutes before events. Cron endpoint at `/api/cron/volunteer-reminders` secured with `CRON_SECRET`. Requires external cron service (cron-job.org) to hit endpoint every 15 minutes.

---

*Last updated: March 2026*
