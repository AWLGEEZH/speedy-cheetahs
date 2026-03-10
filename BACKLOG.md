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

### 2. Micro-Animations & Transitions

**Priority:** High
**Effort:** ~1-2 hours

Add smooth transitions and animations throughout the app to make interactions feel polished and responsive.

**Scope:**
- CSS transitions on card expand/collapse (roster, schedule forms)
- Tab switching animations (Game Day tabs, nav)
- Toast notification slide-in/fade-out
- Button press feedback (subtle scale)
- Page transition effects
- Framer Motion or CSS-only approach

---

### 3. Color Palette & Typography Refresh

**Priority:** High
**Effort:** ~1-2 hours

Elevate visual design with a refined color system and better font hierarchy.

**Scope:**
- Warm accent color (gold/amber) for Cheetahs brand alongside navy
- Improved font sizing hierarchy (headings, body, captions)
- More whitespace and breathing room in layouts
- Consistent color tokens across components
- Better contrast and readability on mobile

---

### 4. Team Logo & Branding

**Priority:** High
**Effort:** ~1-2 hours

Replace emoji cheetah with a real team logo throughout the app.

**Scope:**
- AI-generated or custom Cheetahs logo
- Update nav bar, home page, PWA icons, and favicon
- Branded loading/splash screen
- Consistent brand presence across all pages

---

### 5. Loading Skeletons

**Priority:** High
**Effort:** ~1-2 hours

Replace circular spinners with skeleton placeholder animations that match content shapes.

**Scope:**
- Skeleton components for cards, lists, tables
- Schedule page skeleton (event cards)
- Roster page skeleton (player cards)
- Game Day skeleton (attendance list, batting lineup)
- Updates page skeleton
- Pulse animation matching modern app patterns (Instagram, YouTube style)

---

### 6. Dashboard Visual Upgrade

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

### 7. Pull-to-Refresh on Mobile

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

### 8. Dark Mode

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

### 9. Haptic-Style Feedback & Celebrations

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

### 10. Real-Time Updates via Server-Sent Events

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

### 11. Parent Onboarding Flow

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
