-- 0002_ledger.sql — Tally ledger core (Milestone 2)
-- Entries (the ledger), proofs, holidays + PH 2026 seed, proof storage bucket.
-- Balances are DERIVED from entries in the app — never stored here.

-- ============================================================
-- Enums
-- ============================================================
create type public.entry_kind as enum ('vl', 'sl', 'il_spend', 'unpaid', 'holiday_work');
create type public.portion as enum ('full', 'half');
create type public.credit_as as enum ('il', 'ot');
create type public.holiday_type as enum ('regular', 'special');

-- ============================================================
-- holidays (seeded reference data; readable by all signed-in users)
-- ============================================================
create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  type public.holiday_type not null,
  year int not null,
  country text not null default 'PH',
  unique (country, date)
);
create index holidays_year_idx on public.holidays (year);

-- ============================================================
-- entries (the ledger)
-- amount is signed: leaves negative, holiday_work positive.
-- portion/credit_as apply only to holiday_work.
-- ============================================================
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date_start date not null,
  date_end date not null,
  year int not null,
  kind public.entry_kind not null,
  portion public.portion,
  credit_as public.credit_as,
  amount numeric(5, 1) not null,
  note text,
  holiday_id uuid references public.holidays (id),
  created_at timestamptz not null default now(),
  constraint holiday_work_has_fields check (
    kind <> 'holiday_work'
    or (portion is not null and credit_as is not null and amount > 0)
  ),
  constraint leaves_are_negative check (
    kind = 'holiday_work' or amount <= 0
  )
);
create index entries_user_year_idx on public.entries (user_id, year);
create index entries_date_idx on public.entries (date_start);

-- ============================================================
-- proofs (one per entry; Replace overwrites)
-- ============================================================
create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null unique references public.entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  size_bytes bigint not null default 0,
  uploaded_at timestamptz not null default now()
);
create index proofs_user_idx on public.proofs (user_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.holidays enable row level security;
alter table public.entries enable row level security;
alter table public.proofs enable row level security;

-- holidays: any authenticated user can read the calendar.
create policy "holidays_select_all" on public.holidays
  for select to authenticated using (true);

-- entries: own everything (teammate read access added in Milestone 3).
create policy "entries_select_own" on public.entries
  for select using (user_id = auth.uid());
create policy "entries_insert_own" on public.entries
  for insert with check (user_id = auth.uid());
create policy "entries_update_own" on public.entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "entries_delete_own" on public.entries
  for delete using (user_id = auth.uid());

-- proofs: own everything (teammate read access added in Milestone 3).
create policy "proofs_select_own" on public.proofs
  for select using (user_id = auth.uid());
create policy "proofs_insert_own" on public.proofs
  for insert with check (user_id = auth.uid());
create policy "proofs_update_own" on public.proofs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "proofs_delete_own" on public.proofs
  for delete using (user_id = auth.uid());

-- ============================================================
-- Storage: private "proofs" bucket + owner-scoped object policies.
-- Path convention: <user_id>/<entry_id>/<filename> so the first folder
-- segment is the owner, checked in policies.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

create policy "proofs_objects_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "proofs_objects_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "proofs_objects_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "proofs_objects_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Seed: Philippine holidays 2026 (18 dates: 10 regular + 8 special)
-- ============================================================
insert into public.holidays (date, name, type, year, country) values
  ('2026-01-01', 'New Year''s Day', 'regular', 2026, 'PH'),
  ('2026-02-17', 'Chinese New Year', 'special', 2026, 'PH'),
  ('2026-02-25', 'EDSA People Power Anniversary', 'special', 2026, 'PH'),
  ('2026-04-02', 'Maundy Thursday', 'regular', 2026, 'PH'),
  ('2026-04-03', 'Good Friday', 'regular', 2026, 'PH'),
  ('2026-04-04', 'Black Saturday', 'special', 2026, 'PH'),
  ('2026-04-09', 'Araw ng Kagitingan', 'regular', 2026, 'PH'),
  ('2026-05-01', 'Labor Day', 'regular', 2026, 'PH'),
  ('2026-06-12', 'Independence Day', 'regular', 2026, 'PH'),
  ('2026-08-21', 'Ninoy Aquino Day', 'special', 2026, 'PH'),
  ('2026-08-31', 'National Heroes Day', 'regular', 2026, 'PH'),
  ('2026-11-01', 'All Saints'' Day', 'special', 2026, 'PH'),
  ('2026-11-30', 'Bonifacio Day', 'regular', 2026, 'PH'),
  ('2026-12-08', 'Feast of the Immaculate Conception', 'special', 2026, 'PH'),
  ('2026-12-24', 'Christmas Eve', 'special', 2026, 'PH'),
  ('2026-12-25', 'Christmas Day', 'regular', 2026, 'PH'),
  ('2026-12-30', 'Rizal Day', 'regular', 2026, 'PH'),
  ('2026-12-31', 'Last Day of the Year', 'special', 2026, 'PH')
on conflict (country, date) do nothing;
