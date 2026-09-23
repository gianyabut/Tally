-- 0001_init.sql — Tally core schema (Milestone 1)
-- Identity, teams, membership, per-year credits. RLS on everything.
-- A solo workspace IS a team with one member (one code path). Balances are
-- never stored — derived from entries (added in Milestone 2).

-- ============================================================
-- Enums
-- ============================================================
create type public.role as enum ('admin', 'manager', 'hr', 'staff');

-- ============================================================
-- Tables
-- ============================================================

-- profiles: mirrors auth.users (the "users" entity). Google-only, no passwords.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- teams: creator becomes admin. A team of one is a personal workspace.
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- memberships: one active membership per user (v1).
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  role public.role not null default 'staff',
  joined_at timestamptz not null default now(),
  unique (user_id)
);
create index memberships_team_id_idx on public.memberships (team_id);

-- year_settings: yearly credits per user. Editable later.
create table public.year_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year int not null,
  vl_credits numeric(5, 1) not null default 15,
  sl_credits numeric(5, 1) not null default 15,
  il_carryover numeric(5, 1) not null default 0,
  unique (user_id, year)
);

-- ============================================================
-- Helper: caller's team id.
-- SECURITY DEFINER so policies can call it without recursing into
-- memberships' own RLS.
-- ============================================================
create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.memberships where user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- New-user trigger: create a profile row from Google metadata.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- Onboarding RPC: create the solo workspace + credits atomically.
-- SECURITY DEFINER so it can write teams/memberships despite locked-down RLS.
-- Idempotent: re-running only upserts the year's credits.
-- ============================================================
create or replace function public.complete_solo_onboarding(
  p_team_name text,
  p_year int,
  p_vl numeric,
  p_sl numeric,
  p_carry numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_team_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select team_id into v_team_id
  from public.memberships
  where user_id = v_uid;

  if v_team_id is null then
    insert into public.teams (name, created_by)
    values (coalesce(nullif(p_team_name, ''), 'My workspace'), v_uid)
    returning id into v_team_id;

    insert into public.memberships (user_id, team_id, role)
    values (v_uid, v_team_id, 'admin');
  end if;

  insert into public.year_settings (user_id, year, vl_credits, sl_credits, il_carryover)
  values (v_uid, p_year, p_vl, p_sl, p_carry)
  on conflict (user_id, year) do update
  set vl_credits = excluded.vl_credits,
      sl_credits = excluded.sl_credits,
      il_carryover = excluded.il_carryover;

  return v_team_id;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.memberships enable row level security;
alter table public.year_settings enable row level security;

-- profiles: read/update your own (teammate visibility comes in Milestone 3).
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- teams: members can read their team.
create policy "teams_select_own" on public.teams
  for select using (id = public.current_team_id());

-- memberships: read your own membership.
create policy "memberships_select_own" on public.memberships
  for select using (user_id = auth.uid());

-- year_settings: full control over your own rows.
create policy "year_settings_select_own" on public.year_settings
  for select using (user_id = auth.uid());
create policy "year_settings_insert_own" on public.year_settings
  for insert with check (user_id = auth.uid());
create policy "year_settings_update_own" on public.year_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- teams/memberships inserts happen only via SECURITY DEFINER RPCs above,
-- so no client insert/update policies are granted for them.

-- ============================================================
-- Grants
-- ============================================================
grant execute on function public.current_team_id() to authenticated;
grant execute on function public.complete_solo_onboarding(text, int, numeric, numeric, numeric) to authenticated;

-- ============================================================
-- Backfill: existing auth users (e.g. the account used to test sign-in)
-- predate the trigger, so give them a profile row now.
-- ============================================================
insert into public.profiles (id, email, name, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;
