# Tally — App Flows

## Onboarding
1. Landing → Continue with Google (only auth action)
2. If a pending invite matches / token in URL → "How are you starting?" shows **Join <team>** (INVITE FOUND) and **Start my own space**; no invite → straight to solo path
3. Setup credits: VL / SL / IL carry-over steppers + "PH holidays preloaded"
4a. Joined path → Continue = "Join <team> →" → Ledger (toast: joined, ledger moved)
4b. Solo path → Invite workmates (optional, email chips) → Finish / Skip → Ledger

## Daily loops
- **Log holiday work**: banner "Log now" | ⌘K | FAB → Full/Half → IL or OT card → attach proof (required) → Add to ledger → entry + balance update + toast
- **File a leave**: ⌘K/FAB → days stepper → spend-from (live math, blocks insufficient) → optional note → File → toast
- **Fix pending proof**: red row "● PROOF MISSING" → attach → IL credits + toast
- **View proof**: tap ⎘ meta line → full-screen viewer → Replace/Remove/Download

## Team
- Team tab: balances table (role-scoped detail), out-today strip
- Admin: click role chip → reassign (toast); ＋ Invite → emails → PENDING rows → RESEND/REVOKE
- Invitee: email → Join → Google → onboarding (join path)
- Solo user receiving invite later: bell dot → notification → Accept (consent copy) / Decline

## Export
Export tab → year → who (me / whole team, role-gated) → include toggles → Generate PDF (busy → done) → file download

## Navigation
Desktop: top nav (Ledger/Team/Export) + ⌘K palette + bell. Mobile: bottom indicator bar (3 icon tabs) + square FAB (actions) + bell in header.
