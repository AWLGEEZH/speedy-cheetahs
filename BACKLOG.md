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

Add native-feeling pull-to-refresh on key PWA pages with a visible refresh indicator or "Last updated" timestamp.

**Scope:**
- Schedule page pull-to-refresh
- Updates page pull-to-refresh
- Game Day page pull-to-refresh
- Visual pull indicator with team branding
- Touch gesture handling for iOS and Android
- "Last updated X min ago" timestamp on pages for visibility

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

### 8. Unread Badge on Chat Nav Tab

**Priority:** High
**Effort:** ~1-2 hours

Show an unread message indicator on the Chat nav tab so coaches know when new messages arrive without checking manually.

**Scope:**
- Track last-read timestamp in localStorage per coach
- Poll `/api/chat?after=<timestamp>` for unread count
- Show small red dot or numeric badge on the Chat tab in both desktop and mobile nav
- Clear badge when coach visits the Chat page
- Lightweight — no new DB schema, uses existing chat API

---

### 10. Home Page — RSVP Status on Upcoming Games

**Priority:** High
**Effort:** ~1 hour

Show parents whether they've already RSVP'd for upcoming games directly on the Home page.

**Scope:**
- Read RSVP data from localStorage (already stored by the RSVP page)
- Show "✓ RSVP'd" badge or checkmark next to game events on the Upcoming Events section
- Saves parents a click — they don't need to tap into RSVP page to check status
- Client component wrapper or hybrid approach for localStorage access on server-rendered page

---

### 11. Improved Empty States with Icons & CTAs

**Priority:** Medium
**Effort:** ~1-2 hours

Replace plain text empty states with illustrated empty states that include icons and call-to-action buttons.

**Scope:**
- Schedule: Calendar icon + "No events scheduled" + "Add Event" button (coaches)
- Chat: MessageCircle icon + "No messages yet — start the conversation!"
- Volunteer: HandHelping icon + "No volunteer roles available right now"
- Updates: Megaphone icon + "No updates yet" + "Post Update" button (coaches)
- Consistent styling across all empty states (centered icon, muted text, optional CTA)

---

### 12. Toast Position — Mobile Optimization

**Priority:** Medium
**Effort:** ~30 min

Move toast notifications to top-center on mobile viewports to avoid overlapping chat input or bottom navigation.

**Scope:**
- Detect mobile viewport (Tailwind responsive classes or media query)
- Bottom-right on desktop (current), top-center on mobile
- Adjust animation direction (slide-down on mobile vs slide-in on desktop)
- No logic changes — purely CSS/positioning update in toast component

---

### 13. Coach RSVP Summary Bar on Schedule

**Priority:** Medium
**Effort:** ~1 hour

Add a summary bar at the top of the Schedule page showing coaches their overall RSVP status at a glance.

**Scope:**
- "You've RSVP'd to 6/8 upcoming events" progress indicator
- Small horizontal bar below the page header, visible only to coaches
- Computed from existing coachRsvps data already loaded with events
- Links to first un-RSVP'd event when tapped
- No API changes — uses data already in the response

---

### 14. Chat — Skeleton Loading States

**Priority:** Medium
**Effort:** ~30 min

Replace the plain "Loading messages..." text on the Chat page with chat-bubble-shaped skeleton loaders.

**Scope:**
- Chat bubble skeletons (alternating left/right alignment)
- Shimmer animation matching existing skeleton components
- 4-6 skeleton bubbles with varying widths for realistic appearance
- Reuse existing skeleton/shimmer patterns from `src/components/ui/skeleton.tsx`

---

### 15. Chat — Character Counter

**Priority:** Low
**Effort:** ~15 min

Show a character counter near the chat input to indicate how many characters remain before hitting the 2000-character limit.

**Scope:**
- Subtle "142/2000" counter below or beside the textarea
- Changes color to warning (amber) at 1800+ characters and danger (red) at 1950+
- Prevents surprise validation errors on long messages
- Purely client-side — no API changes

---

### 16. Active Press Feedback on RSVP Buttons

**Priority:** Low
**Effort:** ~15 min

Add tactile press feedback (scale animation) to the Coach RSVP Going/Can't Make It buttons.

**Scope:**
- Add `active:scale-[0.97]` and `transition-transform` to RSVP toggle buttons
- Match the existing press feedback pattern used in the Button component
- Apply to both Going and Can't Make It buttons on Schedule page
- Single-line CSS class additions — no logic changes

---

### 17. Swipe-to-Action on Schedule Events (Mobile Coaches)

**Priority:** Low
**Effort:** ~3-4 hours

Replace small Edit/Trash icons with swipe gestures on mobile for a more native feel.

**Scope:**
- Swipe left on an event card to reveal Edit and Delete action buttons
- Touch gesture handling with snap-back animation
- Fallback to current icon buttons on desktop
- Only visible to coaches (parents see no actions)
- Consider a lightweight swipe library or custom touch handler

---

### 18. Schedule Page — Refresh Button

**Priority:** Low
**Effort:** ~30 min

Add a visible refresh button on the Schedule page for coaches and parents to manually reload events without a full page refresh.

**Scope:**
- Small RefreshCw icon button near the page header
- Triggers existing `load()` function
- Spin animation while loading
- Complements pull-to-refresh (item #3) for non-touch users
- Also useful on Chat page for manual refresh

---

### 19. Image Uploads via Cloudflare R2 (Upgrade)

**Priority:** Medium
**Effort:** ~3-4 hours

Upgrade from paste-URL image support to full drag-and-drop upload via Cloudflare R2. Basic imageUrl support already implemented — this adds native upload UX.

**Scope:**
- Cloudflare R2 storage integration (S3-compatible, free tier: 10GB + 10M reads/mo, no egress fees)
- Install `@aws-sdk/client-s3` for R2 uploads
- New env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- New `/api/upload` route accepting FormData, uploads to R2, returns public URL
- Replace text URL input with drag-and-drop file picker or camera button
- Client-side resize/compress before upload (cap at ~2MB)
- Reuses existing `imageUrl` field on Update model (already in place)

**Foundation note:** This R2 integration and upload API will be reused by Backlog Item #1 (Photo Upload & Sharing), making that feature faster to build later.

---

### 20. Schedule — Expandable Event Cards on Mobile

**Priority:** High
**Effort:** ~1-2 hours

Make event cards tappable on mobile to collapse/expand details, reducing visual density.

**Scope:**
- Show only title, type badge, and date when collapsed
- Expand to reveal location, notes, RSVP button, and coach availability on tap
- Smooth height animation for expand/collapse
- Desktop: always show full details (no collapse behavior)
- Reduces scroll distance on mobile

---

### 21. Volunteer — One-Tap Signup with Auto-Fill

**Priority:** High
**Effort:** ~1 hour

Skip the name/phone form if localStorage already has the parent's info. One tap to sign up.

**Scope:**
- If `speedy-cheetahs-volunteer` localStorage has saved name + phone, sign up immediately on tap
- Show "Signing up as {Name}..." with cancel option
- "Not you? Change info" link to show the full form instead
- Reduces 3-step flow to 1 tap for returning parents
- Falls back to current form if no saved info

---

### 22. Schedule — RSVP Button Prominence for Imminent Games

**Priority:** Medium
**Effort:** ~30 min

Make the RSVP button more visible for games happening in the next 48 hours.

**Scope:**
- Full-width CTA button below event details for games within 48 hours
- Amber/orange background with "RSVP Now" text instead of small outline button
- Subtle urgency indicator: "Game tomorrow — RSVP now!"
- Regular outline button for games further out
- Purely client-side date comparison — no API changes

---

### 23. Home Page — Sticky "Next Event" Banner

**Priority:** Medium
**Effort:** ~1 hour

Show a persistent banner when a game or practice is today or tomorrow.

**Scope:**
- Banner at top of content area: "Practice #5 — Tomorrow at 4:00 PM at Lincoln Park"
- Amber background for games, blue for practices
- Dismiss button to hide for the session
- Only shows for events within 24 hours
- Links to Schedule page or RSVP page (for games)

---

### 24. Volunteer — Skeleton Loading States

**Priority:** Low
**Effort:** ~30 min

Replace the plain spinner on the Volunteer page with content-shaped skeleton loaders matching the grouped role layout.

**Scope:**
- Skeleton group headers (gray bar)
- Skeleton role rows with badge placeholders
- Shimmer animation matching existing skeleton components
- Reduces layout shift when data loads
- Consistent with Schedule and Updates skeleton patterns

---

### 25. Volunteer — Allergy Indicator on Event Header

**Priority:** Low
**Effort:** ~15 min

Show a small allergy icon on the event group header bar when allergies have been reported for that event.

**Scope:**
- Small AlertTriangle icon + count badge next to event label in header bar
- e.g. "Game #1 ⚠ 2 allergies" in the gray header
- Coaches can see at a glance which events have allergy concerns
- Purely visual — data already loaded in `allergies` state

---

### 26. Mobile Nav — Better Active Page Highlight

**Priority:** Low
**Effort:** ~15 min

Improve the active page indicator in the mobile hamburger menu for better visibility.

**Scope:**
- Add orange left-border accent or underline to the active tab
- Current `bg-white/15` is low contrast on the navy background
- Match active state styling between desktop and mobile menus
- Single CSS class change in `unified-layout.tsx`

---

### 27. Parent Registration — Search/Filter

**Priority:** Medium
**Effort:** ~30 min

Add a search input at the top of the registration page to filter players by name.

**Scope:**
- Real-time text filter above the player grid
- Matches against player first/last name and parent name
- Clears when the input is emptied
- Helpful as roster grows beyond 10-15 players
- Purely client-side filtering — no API changes

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

### ~~Schedule — Group Events by Week~~ ✅

**Completed:** March 2026

Events grouped into "This Week", "Next Week", and monthly sections with sticky headers. Shared `groupEventsByPeriod()` utility in `src/lib/utils.ts`. Past events grouped separately.

---

### ~~Home Page — Visual Event Distinction & Relative Timestamps~~ ✅

**Completed:** March 2026

Event cards on Home page use color-tinted backgrounds and left-border accents (amber for games, blue for practices). "View all →" links added to both sections. Updates show relative timestamps ("2 hours ago") instead of absolute dates.

---

### ~~Volunteer — Prominent Empty Slot Indicators~~ ✅

**Completed:** March 2026

Unfilled volunteer roles now show a pulsing "X spots left!" badge in amber instead of the generic "2/3 filled" counter. Draws parent attention to roles that still need help.

---

### ~~Updates — Relative Timestamps~~ ✅

**Completed:** March 2026

Update cards show relative time ("3 hours ago") with full date/time on hover. Consistent with Home page treatment.

---

### ~~Image URL Support on Updates~~ ✅

**Completed:** March 2026

Coaches can attach images to updates by pasting a direct image URL. Live preview in compose/edit forms. Images display on both Updates page and Home page. Basic paste-URL approach — R2 upload upgrade planned as Backlog Item #19.

---

*Last updated: March 14, 2026*
