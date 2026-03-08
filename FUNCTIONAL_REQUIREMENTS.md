# Speedy Cheetahs — Functional Requirements

Complete list of implemented capabilities for the Speedy Cheetahs Farm-1 team management portal.

---

## 1. Authentication & Access Control

- [x] Coach login with email and password (JWT cookie-based sessions)
- [x] Role-based access: HEAD coach and ASSISTANT coach
- [x] Protected routes — coach pages require authentication
- [x] Public pages accessible without login
- [x] Forgot password flow — email-based reset link (15-minute expiry)
- [x] Head coach can reset any assistant coach's password
- [x] Coaches can change their own password (requires current password)
- [x] Auto-redirect to home page after login

---

## 2. Dashboard

- [x] Quick stats tiles: Total Players, Upcoming Events, Recent Updates
- [x] Clickable tiles linking to relevant pages
- [x] Game Day quick-access button
- [x] Next 5 upcoming events with date, time, location, and type badge

---

## 3. Schedule & Event Management

- [x] Create events: Practice, Game, or Other
- [x] Event fields: title, type, opponent (games), start/end time, location name, address, notes
- [x] Edit existing events
- [x] Cancel events (shown with cancelled badge, grayed out)
- [x] Delete events
- [x] Public schedule view — parents see all upcoming events without login
- [x] Event type indicators (red = game, blue = practice)
- [x] Chronological display with formatted dates and times

---

## 4. Roster Management

- [x] Add players with first name, last name, jersey number
- [x] Assign players to families
- [x] Edit player info (name, jersey number, notes)
- [x] Delete players
- [x] Medical/allergy notes field per player
- [x] 2-column grid display with player cards
- [x] Family contact info visible on each player card (parent name, phone)

---

## 5. Family & Contact Management

- [x] Create families when adding players
- [x] Family fields: parent/guardian name, email, phone
- [x] Edit family contact info
- [x] Additional contacts per family (second parent, grandparent, emergency contact)
- [x] Contact relationship types: Parent, Grandparent, Guardian, Emergency Contact, Other
- [x] Sibling linking — multiple players under one family

---

## 6. Parent Registration (Public)

- [x] Public page — no login required
- [x] 2-column roster layout (players 1-8 left, 9-16 right)
- [x] Expandable player cards to show family registration form
- [x] Update parent/guardian name, email, phone
- [x] SMS notification opt-in/opt-out toggle
- [x] Email notification opt-in/opt-out toggle
- [x] Add/remove additional contacts
- [x] Persistent storage — parents can update anytime

---

## 7. Game Day Tracking

- [x] Game selector with status badges (Not Started, Live, Done)
- [x] **Attendance tab** — mark players Present, Absent, or Pending
- [x] One-tap toggle between attendance states
- [x] Attendance counter (confirmed vs. total)
- [x] Real-time sync (10-second polling)
- [x] **Batting tab** — initialize lineup, track batting order and at-bats
- [x] **Fielding tab** — assign field positions to players

---

## 8. Updates & Announcements

- [x] Post updates with title and message
- [x] Optional SMS notification to opted-in families
- [x] Optional email notification to opted-in families
- [x] SMS/email sent count badges on each update
- [x] Edit posted updates (author or HEAD coach)
- [x] Delete posted updates (author or HEAD coach)
- [x] Public updates feed — parents view without login
- [x] Updates displayed on home page (latest 3)
- [x] Author name and timestamp on each update

---

## 9. Notifications

### SMS (Twilio)
- [x] Bulk SMS to opted-in families when posting updates
- [x] Phone number normalization (E.164 format)
- [x] Message prefix: "[Speedy Cheetahs]"
- [x] Sent vs. failed tracking per update
- [x] Error handling for invalid numbers

### Email (Nodemailer / Gmail SMTP)
- [x] Bulk email to opted-in families when posting updates
- [x] HTML-formatted emails with team branding
- [x] Unsubscribe instructions included
- [x] Sent vs. failed tracking per update

### Volunteer Reminders (Automated)
- [x] Automated 24-hour advance reminder to volunteer parents (SMS + email)
- [x] Automated 90-minute heads-up reminder to volunteer parents (SMS + email)
- [x] Cron endpoint (`/api/cron/volunteer-reminders`) secured with `CRON_SECRET`
- [x] Duplicate prevention — reminders only sent once per signup
- [x] Cancelled events automatically skipped
- [x] Respects family SMS and email opt-in preferences

---

## 10. Coaching Insights (AI-Powered)

- [x] Single free-form text input for any coaching question
- [x] AI-generated responses (practice plans, drills, strategies, advice)
- [x] Powered by Anthropic Claude API
- [x] Previous questions and answers saved with timestamps
- [x] Expandable/collapsible session history
- [x] Knowledge base context injected into AI responses

---

## 11. Rules & Knowledge Base (AI-Powered)

- [x] **Rules Editor** — paste/type official league rules
- [x] **Ask AI** — chat interface for rule questions with conversation history
- [x] AI references saved rules when answering
- [x] **Knowledge Base** — supplement rules with additional resources
- [x] Three content types: Text, URL (web fetch), PDF (upload and parse)
- [x] Knowledge base entries listed with type badges
- [x] Delete knowledge base entries
- [x] AI uses all knowledge base content when answering questions

---

## 12. Volunteer Management

- [x] Create volunteer roles for events
- [x] Role fields: name, description, slots needed
- [x] Quick-add templates (Scoreboard, Line-Up Card, Equipment Manager, etc.)
- [x] Public sign-up page — parents browse and sign up without login
- [x] Capacity tracking (X/Y filled badge)
- [x] Full roles grayed out and disabled
- [x] Parent names displayed as tags under each role
- [x] Sign-up form saves info in localStorage for repeat use

---

## 13. Settings & Administration

- [x] All coaches: change own password
- [x] HEAD coach: add assistant coaches (up to 10)
- [x] HEAD coach: edit coach info (name, email, phone)
- [x] HEAD coach: reset assistant coach passwords
- [x] HEAD coach: delete assistant coaches (cascades to their data)
- [x] Shareable portal links for parents (Schedule, Volunteer, Updates, Registration)
- [x] SMS and AI setup instructions

---

## 14. Home Page (Public)

- [x] Team branding with Cheetah logo
- [x] 2x2 icon tile grid: View Schedule, Parent Registration, Volunteer Sign-Up, Coach Login
- [x] Upcoming events section (next 5)
- [x] Recent updates section (latest 3)
- [x] Responsive layout for mobile and desktop

---

## 15. Navigation & Layout

- [x] Unified top navigation bar for all pages
- [x] Public tabs: Home, Schedule, Updates, Volunteer, Parent Registration
- [x] Coach tabs (visible when logged in): Dashboard, Roster, Game Day, Coaching, Rules & AI, Settings
- [x] Mobile hamburger menu (responsive below 1024px)
- [x] Auth-aware: shows Coach Login button or coach name + Sign Out
- [x] Nav hidden on login, forgot password, and reset password pages

---

## 16. Redirects & Backwards Compatibility

- [x] Old `/team/*` paths permanently redirect (308) to new root paths
- [x] `/team/schedule` → `/schedule`
- [x] `/team/updates` → `/updates`
- [x] `/team/volunteer` → `/volunteer`
- [x] `/team/register` → `/register`

---

## 17. Infrastructure

- [x] Next.js 16 (App Router) with TypeScript
- [x] Tailwind CSS v4 for styling
- [x] Prisma v7 ORM with PostgreSQL (Railway)
- [x] Railway deployment with auto-deploy on push
- [x] Prisma migrations run on deploy (`npx prisma migrate deploy`)
- [x] Vitest test suite (16 tests)
- [x] Privacy Policy and Terms of Service pages

---

*Last updated: March 2026*
