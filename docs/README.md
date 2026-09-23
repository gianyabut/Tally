# Handoff: Tally — Leave & Holiday-Work Tracker

## Overview
Tally is a leave tracker for small teams (~10 people). Members set yearly leave credits, file leaves, log work done on public holidays (choosing an In-Lieu day OR a paid OT day, with mandatory image proof), see teammates' balances, and export a per-person annual PDF report for HR. Web only, desktop + mobile responsive, dark + light themes.

## About the Design Files
The files in this bundle are **design references created in HTML** (interactive prototypes). They show intended look and behavior — they are NOT production code to copy. Recreate these designs in the target codebase's environment using its established patterns. The target repo is `gianyabut/Tally` (currently empty) — choose an appropriate modern web stack (see MILESTONES.md for constraints).

- `Tally App.dc.html` — the full interactive app (all screens, both themes via a `theme` prop, mobile layout via a `mobile` prop). PRIMARY REFERENCE.
- `Tally Prototype.dc.html` — board mounting the app 4x (dark/light × desktop/mobile).
- `Tally Onboarding.dc.html` — same app starting at the onboarding flow.
- `support.js` — prototype runtime; ignore, reference only.
- The HTML uses a template syntax ({{ holes }}, sc-for/sc-if); read it as JSX-like markup.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final. Recreate pixel-perfectly. All colors are expressed as CSS custom properties with exact hex values per theme (see Design Tokens).

## Design Tokens

### Typography
- UI text: **IBM Plex Sans** (400/500/600/700)
- ALL numbers, dates, labels, meta text: **IBM Plex Mono** (400/500) — hard rule
- Scale: giant numerals 52–64px; section numerals 40–46px; row titles 14–15.5px/600; body 13–13.5px; meta/labels 9.5–11px mono with letter-spacing .1–.2em, uppercase
- Radius: 4px (buttons, cards, modals), 6px (mobile cards); nothing rounder except avatar circles and the mobile FAB

### Colors — dark theme (default)
| token | hex | use |
|---|---|---|
| bg | #0B0B0A | app background |
| ink | #F0EEE9 | primary text, filled buttons bg, lit tally marks |
| mut | #A5A39B | secondary text |
| dim | #6C6A64 | tertiary text, inactive icons |
| faint | #55534D | quietest text, meta |
| line | #222220 | section borders |
| hair | #33322F | emphasized borders (cards, modals) |
| row | #1C1C1A | row separators, selected fills |
| track | #262623 | empty chart tracks, rails |
| ring2 | #8F8D85 | secondary data series (Sick) |
| sig | #FF4438 | THE ONLY COLOR: pending proof, OUT, revoke, notification dot |
| btnbg/btnfg | #F0EEE9 / #0B0B0A | primary button (inverted) |
| scrim | rgba(11,11,10,.68) | modal overlay |

### Colors — light theme ("analog ivory")
bg #F2EFE6 · ink #1D1B16 · mut #57534A · dim #8B8574 · faint #B4AE9D · line #DCD7C9 · hair #C9C3B2 · row #EAE6D9 · track #DCD7C9 · ring2 #8B8574 · sig #E8552F (international orange, replaces red) · btnbg #1D1B16 / btnfg #F2EFE6 · scrim rgba(29,27,22,.45). Paper/PDF preview stays #FDFDFB in both themes.

### Brand mark
Tally-marks logo: 3 vertical strokes + 1 diagonal strike, stroke-linecap round, drawn in ink color (green never used in final skin). SVG path in the design files.

## Screens

### 1. Login
Centered column: logo (40px), "TALLY" mono 13px ls .24em, tagline "every day off, counted" mono dim. One primary button: **Continue with Google** (48px tall, inverted). Caption: "ONE BUTTON — SIGN-UP AND SIGN-IN ARE THE SAME. / INVITED BY A TEAMMATE? SAME BUTTON." Footer: "no passwords · google auth only". No email/password fields — Google OAuth only.

### 2. Onboarding — Start (STEP 1 OF 2/3)
Header bar (58px, logo + step counter). Question: "How are you starting?" Two option cards (border hair/line, radius 6):
- **Join Bluefin Studio** + dashed sig badge "INVITE FOUND" + meta "JOPAY M. INVITED YOU · 10 MEMBERS · YOU JOIN AS STAFF"
- **Start my own space** + meta "A TEAM OF ONE — TRACK YOUR YEAR, INVITE WORKMATES LATER"
Consent footnote (mono faint): joining moves your ledger; balances visible to Admin/Manager/HR.

### 3. Onboarding — Setup credits (STEP 2)
"Set up your 2026 ledger". Three stepper fields (Vacation 15, Sick 15, IL carry-over 0): giant mono numeral over hairline, − / + square buttons (34px). Row: "Philippine holidays 2026 preloaded · 18 DATES". Footer: "Continue →" (solo) or "Join Bluefin Studio →" (invited path skips step 3).

### 4. Onboarding — Invite (STEP 3, solo only, optional)
"Invite your workmates" + "Any email works — the invite is their signup. They join as Staff." Email input (hairline underline) + Add button → chips (email ✕). Actions: **Finish setup** (primary) / "Skip for now" (dim text).

### 5. Ledger (home)
**Desktop** (header 60px: logo, nav Ledger/Team/Export with 2px underline on active, right: bell w/ sig dot, ⌘K chip, FY2026, avatar):
- Balances row: left block "DAYS OFF LEFT" label + total (64px mono, e.g. 25.5) + caption "11.5 VL + 12 SL + 2 IL". Right: 4 **tally-mark rows** (Vacation/Sick/In-Lieu/OT paid) — SVG tally strokes, groups of 5 (4 verticals + diagonal strike), stroke-width 2.2 round; remaining-to-cap strokes in hair color; half day = short horizontal dash; pending IL = dashed sig half-mark. Value right-aligned mono 16px with /cap suffix.
- Holiday banner card (border hair): "NEXT HOLIDAY · T−72D" (mono ring2), "Bonifacio Day", "2026-11-30 · MON · REGULAR", primary button "Log holiday work". Below: "2026 HR report — Export →" row.
- **Timeline (spine)**: header "TIMELINE·2026 / n=9". Month-grouped vertical rail (1px track border-left) with nodes centered per row: filled square ink = OT day, filled square ring2 = IL earned, outline circle = leave spent, filled sig square = pending proof. Month label mono in left gutter on EVERY row (bright mut on first row of month, faint on repeats, sig when pending). Row: day (mono, ranges like "07–08"), title 15px/600, meta line mono 11px uppercase ("WORKED FULL DAY · ⎘ shift_0831.jpg" — click opens proof viewer; pending rows show "● PROOF MISSING — ADD TO CREDIT" in sig, click attaches). Delta right-aligned mono 14px ("OT +1.0", "VL −2.0"). Legend footer: OT DAY / IL EARNED / SPENT / NEEDS YOU.
- Footer strip: "SYNCED · 9 RECORDS" + "Export 2026 →".

**Mobile** (header 56px: logo, bell, FY2026, avatar): centered "DAYS OFF LEFT" + 52px total + caption; compact tally rows (label 60px, smaller svg); holiday strip; same spine timeline (gutter 44px, day col 38px); bottom **indicator bar**: 3 icon-only tabs (ledger/team/export icons 18px) with a 14×2px tick under the active one; square 54px FAB (＋, inverted) floating above bar right, opens the ⌘K actions sheet. Content scrollers need 84px bottom padding to clear the FAB.

### 6. Team
**Desktop**: mono header "TEAM · 11 PEOPLE · YOU ARE ADMIN — CLICK A ROLE TO REASSIGN". "Out today" strip (sig dot, names + leave type) with **＋ Invite** primary button. Table (grid 180/92/1fr/62/56/56/110): MEMBER / ROLE / VL REMAINING (2px bar) / VL / SL / IL / HOL.WORK. Role chips mono 10px: ADMIN filled inverted; MANAGER, HR outlined hair; STAFF outlined line dim; PENDING dashed, row dimmed with RESEND/REVOKE via chip dropdown. Admin clicks a role chip → dropdown (MANAGER/HR/STAFF) → toast. Footer: "STAFF SEE BALANCES + WHO'S OUT · FULL LEDGERS: ADMIN · MANAGER · HR".
**Mobile**: grouped by role — section headers "ADMIN · 1", "MANAGER + HR · 2", "STAFF · 7", "PENDING · n" (mono 9.5 faint over hair border); rows: name + optional OUT + right-aligned mono "vl · sl · il"; pending rows show RESEND / REVOKE. ＋ INVITE top right.

### 7. Invite modal
"Invite to your team" / "ANY EMAIL WORKS — THE INVITE IS THEIR SIGNUP". Email input + Add → chips. Explainer (mono faint): email → Join team → Google sign-in → done; PENDING until they join; expires in 14 days. Footer: "new members join as Staff" + Send N invites (primary). Sent invites appear as PENDING rows.

### 8. Export
**Desktop** (two panes): left controls (360px, border-right) — Year (2026/2025 underline tabs), Who (radio: "Just me — Ara Reyes" / "Whole team · 10 PDFs · ADMIN/MGR/HR only"), Include checklist (✓ Leave history with notes / Holiday work + IL-OT decisions / Proof images as appendix — toggleable), filename line "tally_ara-reyes_2026.pdf · N pages · N proof images", **Generate PDF** button (busy → "Generating…" → "✓ PDF ready — check downloads"). Right: white paper preview (#FDFDFB, 440px) — header "TALLY — ANNUAL LEAVE REPORT" + date; employee/period/ref row; 4-stat summary (VL USED, SL USED, IL EARNED, OT PAID in days); numbered sections **1 LEAVES TAKEN** (date/type/note/−days), **2 HOLIDAYS WORKED — CREDITED AS IL OR PAID AS OT DAY** (date/title/delta/proof page ref, missing proof = "NO PROOF" in red), **3 PROOF OF WORK** — thumbnail grid of attached images with "P.N · filename" + date captions, full-size on appendix pages; footer "Signed digitally via Tally · tally.app/r/REF · PAGE 1 OF N".
**Mobile**: stepper sheet — YEAR row, WHO row (tap toggles), INCLUDE box with toggles, small paper thumbnail, filename, Generate PDF. NO peso amounts anywhere — OT is always day counts.

### 9. Overlays (all absolute within app, scrim behind, width min(520px, 100%−32px), radius 4, border hair)
- **⌘K palette** ("what happened?"): 1 Log holiday work · 2 File a leave. Keyed rows with number chips. Opened via ⌘K chip (desktop) or FAB (mobile).
- **Log holiday work**: Full day / Half day underline tabs; two option cards "Take an In-Lieu day (a day off, spend anytime) — IL +1.0" / "Take an OT day (paid day, next payroll) — OT +1.0"; proof attach row (dashed border, "REQUIRED" in sig until attached, then solid + ✓); footer "it's your ledger — no approvals" + Add to ledger. Confirm without proof → toast error. Success → entry prepended, balances update, toast.
- **File a leave**: DAYS stepper; Spend from options (Vacation/Sick/In-Lieu/Unpaid) each showing live math "9.5 → 6.5" (insufficient → "not enough" in sig, blocked); note input ("optional, goes in the HR export"); footer "teammates see the dates, not the note" + File leave.
- **Proof viewer**: full-surface takeover; filename + size top right; image area; footer: date, holiday, delta, Replace / Remove (sig) / Download.
- **Notifications panel** (bell): dropdown 340px. Invite card: sig dot, "Team invite", "JUST NOW", body (consent copy), **Accept — join team** / Decline. Empty: "NO NOTIFICATIONS — ALL CLEAR".
- **Toasts**: bottom-center inverted chip, ~2.6s, e.g. "IL +1.0 credited — Bonifacio Day", "Proof attached — IL credited", "3 invites sent — pending until they join".

## Interactions & Behavior
- Keyboard: ⌘K opens palette; number keys select; Enter confirms; Esc closes (desktop).
- Hover states: borders brighten (line→dim), opacity .85 on buttons, row bg on palette items.
- All balances derived live from the entries list (see DATA_MODEL.md invariants).
- Theme: dark default, light = ivory palette swap via tokens only (no layout change).
- Hit targets ≥44px on mobile.

## State Management (prototype reference)
entries[], setup{vl,sl,carry}, roster[] w/ roles+pending, notifs[], view, modal, who/includes/genState (export), invite draft+chips. Balances computed: vlUsed/slUsed/ilEarned/ilSpent/ilPending/otDays. See the Component class in Tally App.dc.html for exact logic.

## Assets
No raster assets. Logo is inline SVG (tally marks). Fonts from Google Fonts (IBM Plex Sans, IBM Plex Mono). Proof images are user uploads (prototype uses placeholders).
