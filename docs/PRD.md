# Tally — Product Requirements (v1)

## Problem
Small teams track leave credits and holiday work in spreadsheets. When someone works a public holiday, the compensation (a day off in lieu, or a paid OT day) is agreed informally and often lost. HR asks for year-end summaries nobody has.

## Users
- Team members (staff) tracking their own year
- Managers / HR needing team visibility and exports
- One Admin per team (creator) managing membership and roles

## Core decisions (settled — do not relitigate)
1. **Auth: Google OAuth only.** Sign-up = sign-in, one button. No passwords, no email/password flow.
2. **Solo-first.** Every new user lands in a personal workspace (team of one) with the full feature set. Teams are an upgrade, not a requirement.
3. **Invite-as-signup.** Admin invites any email; the email's Join link → Google sign-in → onboarding with team attached. Invite is a token, not an email lock (whoever claims the link joins; Admin sees which account claimed it). Invites expire in 14 days; PENDING until accepted; Admin can resend/revoke.
4. **Joining moves your ledger.** One confirmation with explicit consent copy. One team per user (v1).
5. **Solo users can still receive invites** — surfaced as in-app notifications (bell) with Accept/Decline, plus the invite email.
6. **Holiday work compensation**: worker chooses at logging time — In-Lieu day (IL) or OT day. Full day = 1.0, half = 0.5. **OT is measured in days, never money.** No peso amounts anywhere in the product.
7. **Proof required.** A holiday-work entry does not credit until an image proof (timesheet/DTR screenshot) is attached. Pending entries are visually flagged and excluded from balances.
8. **No approvals.** It's a self-managed ledger. Filing a leave just records it.
9. **Roles**: Admin (manage team, assign roles, export anyone) · Manager and HR (two labels, same v1 permissions: see all members' full ledgers incl. notes/proofs, export team) · Staff (own ledger full; teammates: balances + who's-out only — no notes, no proofs; export self only).
10. **Leave types**: Vacation (VL), Sick (SL), In-Lieu (IL, earned), Unpaid. Credits set per user per year at onboarding; editable later. IL can carry over.
11. **PH holidays preloaded** per year (regular + special non-working).
12. **Export**: per-person-per-year PDF (summary, leaves with notes, holiday work with IL/OT decisions, proof images as appendix). Whole-team = zip of per-person PDFs, available to Admin/Manager/HR only.

## Out of scope (v1)
Approval workflows · multi-team membership · non-PH holiday calendars · payroll integration · money amounts · native apps.

## Success
A member can log a worked holiday with proof in <30s; HR receives a complete, verifiable year PDF without asking anyone.
