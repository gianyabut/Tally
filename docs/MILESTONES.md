# Tally — Implementation Milestones

## Stack constraints (choose within these; repo gianyabut/Tally is empty)
- Web app, responsive 390px–1440px, dark + light themes via CSS custom properties (tokens in README)
- Google OAuth (only auth), session management
- Image upload + storage for proofs (private; role-gated access)
- Server-side PDF generation (report layout in README §8)
- Transactional email (invites)
- Any modern stack works; pick one Claude Code is productive in (e.g. Next.js + Postgres/Supabase or similar)

## Milestone 1 — Auth + workspace shell
Google sign-in · users/teams/memberships (solo team auto-created) · onboarding steps 1–2 (start fork stubbed to solo, credits setup) · app shell: top nav / mobile bottom bar + FAB · theme tokens + both themes

## Milestone 2 — Ledger core
year_settings · entries CRUD via Log holiday work + File a leave modals (⌘K palette, keyboard support) · derived balances + tally-mark visualization · spine timeline · PH 2026 holiday seed + next-holiday banner · proof upload, pending state, proof viewer · toasts

## Milestone 3 — Team, roles, invites
Team views (desktop table / mobile grouped) · role assignment (admin) · visibility enforcement per role · invite flow end-to-end: modal → email → token claim → onboarding join path → PENDING → accepted · notifications bell + accept/decline · out-today strip

## Milestone 4 — Export
PDF per person-year (summary, leaves, holiday work, proof appendix, page refs, digital-signature ref line) · include toggles · whole-team zip (role-gated) · export screens desktop + mobile

## Acceptance walkthrough (matches the prototype)
1. New user → Google → solo → credits → skip invites → ledger shows 25.5 days left
2. Log Bonifacio Day full IL without proof → blocked; attach proof → IL +1.0 credited
3. File 3-day VL Oct 12–14 → balance math live, entry "10-12–14"
4. Invite 2 emails → PENDING rows; second account claims link → joins as Staff
5. Staff account sees teammates' balances but not notes/proofs
6. Generate PDF → sections 1/2/3 + proof appendix, OT shown in days
