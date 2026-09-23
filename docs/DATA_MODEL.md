# Tally — Data Model (entities, not migrations)

## Entities
- **users**: id, google_id, email, name, avatar_url, created_at. Google-only: no password columns.
- **teams**: id, name, created_by. A solo workspace IS a team with one member — one code path.
- **memberships**: user_id, team_id, role enum(admin|manager|hr|staff), joined_at. Constraint: one active membership per user (v1). Team creator gets admin.
- **invites**: id, team_id, email, token (unique, the claim credential), invited_by, status enum(pending|accepted|revoked|expired), claimed_by_user_id nullable, expires_at (14d), created_at. Accepting with a different Google email is allowed; record claimed_by.
- **year_settings**: user_id, year, vl_credits (default 15), sl_credits (default 15), il_carryover (default 0). Unique (user, year).
- **entries** (the ledger): id, user_id, date_start, date_end, year, kind enum(vl|sl|il_spend|unpaid|holiday_work), portion enum(full|half) for holiday_work, credit_as enum(il|ot) for holiday_work, amount decimal (signed: leaves negative, holiday_work positive), note text nullable, holiday_id nullable, created_at.
- **proofs**: id, entry_id, file_url, file_name, size_bytes, uploaded_at. v1: one proof per entry (Replace overwrites).
- **holidays**: id, date, name, type enum(regular|special), year, country ('PH' seeded).
- **notifications**: id, user_id, type ('team_invite'), payload jsonb (invite_id, team, inviter), read_at nullable, created_at.

## Invariants (enforce in service layer)
1. Balances are ALWAYS derived from entries — never stored. vl_left = vl_credits − Σ vl; il_available = il_carryover + Σ credited il − Σ il_spend; ot_days = count of credited holiday_work with credit_as=ot.
2. A holiday_work entry is **pending** (excluded from balances and from "credited" export status) until it has a proof.
3. A leave cannot be filed beyond available balance for its type (Unpaid is unlimited).
4. Deleting/revoking an invite never deletes a user; accepting moves the user's entries visibility into the team (entries stay owned by the user).
5. Visibility: staff → teammates' derived balances + current out-status only; manager/hr/admin → full entries, notes, proofs of team members; everyone → own everything.
6. Exports are scoped by the same visibility rules.
