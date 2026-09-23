-- 0003_team.sql — Tally team, roles, invites, notifications (Milestone 3)
-- Adds team-visibility RLS: staff see teammates' derived balances + out-status
-- (via a SECURITY DEFINER overview RPC, never raw entries); manager/hr/admin
-- see full entries, notes and proofs of team members.

-- ============================================================
-- Enums + tables
-- ============================================================
create type public.invite_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text not null,
  -- 64-char random token from two UUIDs (built-in; avoids the pgcrypto dependency).
  token text not null unique default (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  ),
  invited_by uuid not null references public.profiles (id),
  status public.invite_status not null default 'pending',
  claimed_by_user_id uuid references public.profiles (id),
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);
create index invites_team_idx on public.invites (team_id);
create index invites_email_idx on public.invites (lower(email));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, read_at);

-- ============================================================
-- Helpers
-- ============================================================
create or replace function public.is_teammate(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m1
    join public.memberships m2 on m1.team_id = m2.team_id
    where m1.user_id = auth.uid() and m2.user_id = target
  );
$$;

create or replace function public.is_privileged()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and role in ('admin', 'manager', 'hr')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Expanded RLS: replace own-only SELECT with team visibility
-- ============================================================
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_team" on public.profiles
  for select using (id = auth.uid() or public.is_teammate(id));

drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_team" on public.memberships
  for select using (user_id = auth.uid() or public.is_teammate(user_id));

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_team" on public.entries
  for select using (
    user_id = auth.uid()
    or (public.is_privileged() and public.is_teammate(user_id))
  );

drop policy if exists "proofs_select_own" on public.proofs;
create policy "proofs_select_team" on public.proofs
  for select using (
    user_id = auth.uid()
    or (public.is_privileged() and public.is_teammate(user_id))
  );

-- teams: readable by any member of the team.
drop policy if exists "teams_select_own" on public.teams;
create policy "teams_select_member" on public.teams
  for select using (id = public.current_team_id());

-- invites: any team member may read their team's invites (team view shows pending).
alter table public.invites enable row level security;
create policy "invites_select_team" on public.invites
  for select using (team_id = public.current_team_id());

-- notifications: own only; user may mark their own read.
alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- storage: privileged teammates may read team members' proof objects.
create policy "proofs_objects_select_team" on storage.objects
  for select to authenticated using (
    bucket_id = 'proofs'
    and public.is_privileged()
    and (storage.foldername(name))[1] in (
      select user_id::text from public.memberships
      where team_id = public.current_team_id()
    )
  );

-- ============================================================
-- Team overview: per-member derived balances + out-today.
-- SECURITY DEFINER so Staff get balances without reading raw entries.
-- ============================================================
create or replace function public.team_overview(p_year int)
returns table (
  user_id uuid, name text, role public.role, is_self boolean,
  out_today boolean, out_type text,
  vl_left numeric, sl_left numeric, il_avail numeric, hol_summary text
)
language sql stable security definer set search_path = public as $$
  with team as (
    select m.user_id, m.role from public.memberships m
    where m.team_id = public.current_team_id()
  ),
  agg as (
    select t.user_id, t.role,
      coalesce(ys.vl_credits, 15) as vlc,
      coalesce(ys.sl_credits, 15) as slc,
      coalesce(ys.il_carryover, 0) as ilc,
      coalesce(sum(case when e.kind = 'vl' then -e.amount end), 0) as vl_used,
      coalesce(sum(case when e.kind = 'sl' then -e.amount end), 0) as sl_used,
      coalesce(sum(case when e.kind = 'il_spend' then -e.amount end), 0) as il_spent,
      coalesce(sum(case when e.kind = 'holiday_work' and e.credit_as = 'il' and pr.id is not null then e.amount end), 0) as il_earned,
      count(*) filter (where e.kind = 'holiday_work' and e.credit_as = 'ot' and pr.id is not null) as ot_days,
      count(*) filter (where e.kind = 'holiday_work' and e.credit_as = 'il' and pr.id is not null) as il_days,
      bool_or(e.kind in ('vl','sl','il_spend','unpaid') and current_date between e.date_start and e.date_end) as out_today,
      max(case when e.kind in ('vl','sl','il_spend','unpaid') and current_date between e.date_start and e.date_end
          then upper(case when e.kind = 'il_spend' then 'il' else e.kind::text end) end) as out_type
    from team t
    left join public.year_settings ys on ys.user_id = t.user_id and ys.year = p_year
    left join public.entries e on e.user_id = t.user_id and e.year = p_year
    left join public.proofs pr on pr.entry_id = e.id
    group by t.user_id, t.role, ys.vl_credits, ys.sl_credits, ys.il_carryover
  )
  select a.user_id, p.name, a.role, a.user_id = auth.uid() as is_self,
    coalesce(a.out_today, false) as out_today, a.out_type,
    a.vlc - a.vl_used as vl_left,
    a.slc - a.sl_used as sl_left,
    a.ilc + a.il_earned - a.il_spent as il_avail,
    (a.il_days || ' IL · ' || a.ot_days || ' OT') as hol_summary
  from agg a
  join public.profiles p on p.id = a.user_id
  order by (a.role = 'admin') desc, a.role, p.name;
$$;

-- ============================================================
-- Role assignment (admin only)
-- ============================================================
create or replace function public.set_member_role(p_target uuid, p_role public.role)
returns void language plpgsql security definer set search_path = public as $$
declare v_team uuid := public.current_team_id();
begin
  if not public.is_admin() then raise exception 'only admin can assign roles'; end if;
  if not exists (select 1 from public.memberships where user_id = p_target and team_id = v_team) then
    raise exception 'not a team member';
  end if;
  update public.memberships set role = p_role where user_id = p_target and team_id = v_team;
end;
$$;

-- ============================================================
-- Invites: create / accept / revoke / resend
-- ============================================================
create or replace function public.create_invites(p_emails text[])
returns setof public.invites language plpgsql security definer set search_path = public as $$
declare
  v_team uuid := public.current_team_id();
  v_email text;
  v_inv public.invites;
  v_uid uuid;
begin
  if not public.is_admin() then raise exception 'only admin can invite'; end if;
  foreach v_email in array p_emails loop
    v_email := lower(trim(v_email));
    if v_email = '' or position('@' in v_email) = 0 then continue; end if;

    insert into public.invites (team_id, email, invited_by)
    values (v_team, v_email, auth.uid())
    returning * into v_inv;

    select id into v_uid from public.profiles where lower(email) = v_email;
    if v_uid is not null then
      insert into public.notifications (user_id, type, payload)
      values (v_uid, 'team_invite', jsonb_build_object(
        'invite_id', v_inv.id,
        'team_id', v_team,
        'token', v_inv.token,
        'team', (select name from public.teams where id = v_team),
        'from', (select coalesce(name, email) from public.profiles where id = auth.uid())
      ));
    end if;

    return next v_inv;
  end loop;
end;
$$;

create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_inv public.invites;
  v_uid uuid := auth.uid();
  v_old_team uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_inv from public.invites where token = p_token;
  if v_inv.id is null then raise exception 'invite not found'; end if;
  if v_inv.status <> 'pending' then raise exception 'invite is no longer pending'; end if;
  if v_inv.expires_at < now() then
    update public.invites set status = 'expired' where id = v_inv.id;
    raise exception 'invite expired';
  end if;

  select team_id into v_old_team from public.memberships where user_id = v_uid;

  update public.memberships set team_id = v_inv.team_id, role = 'staff' where user_id = v_uid;
  if not found then
    insert into public.memberships (user_id, team_id, role) values (v_uid, v_inv.team_id, 'staff');
  end if;

  update public.invites set status = 'accepted', claimed_by_user_id = v_uid where id = v_inv.id;

  update public.notifications set read_at = now()
  where user_id = v_uid and type = 'team_invite'
    and (payload ->> 'invite_id')::uuid = v_inv.id;

  -- Remove the now-empty solo team the user left behind.
  if v_old_team is not null and v_old_team <> v_inv.team_id then
    delete from public.teams t where t.id = v_old_team
      and not exists (select 1 from public.memberships m where m.team_id = t.id);
  end if;

  return v_inv.team_id;
end;
$$;

-- Preview an invite by token (used by the /join page before the invitee is a
-- member, so it can't rely on RLS). Returns team + inviter + validity.
create or replace function public.invite_preview(p_token text)
returns table (team_name text, inviter text, valid boolean)
language sql stable security definer set search_path = public as $$
  select t.name, coalesce(p.name, p.email),
    (i.status = 'pending' and i.expires_at > now())
  from public.invites i
  join public.teams t on t.id = i.team_id
  join public.profiles p on p.id = i.invited_by
  where i.token = p_token;
$$;

create or replace function public.revoke_invite(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'only admin can revoke'; end if;
  delete from public.invites where id = p_id and team_id = public.current_team_id();
end;
$$;

create or replace function public.resend_invite(p_id uuid)
returns public.invites language plpgsql security definer set search_path = public as $$
declare v_inv public.invites;
begin
  if not public.is_admin() then raise exception 'only admin can resend'; end if;
  update public.invites
  set expires_at = now() + interval '14 days', status = 'pending'
  where id = p_id and team_id = public.current_team_id()
  returning * into v_inv;
  return v_inv;
end;
$$;

-- ============================================================
-- Grants
-- ============================================================
grant execute on function public.team_overview(int) to authenticated;
grant execute on function public.set_member_role(uuid, public.role) to authenticated;
grant execute on function public.create_invites(text[]) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
grant execute on function public.resend_invite(uuid) to authenticated;
grant execute on function public.invite_preview(text) to anon, authenticated;
grant execute on function public.is_teammate(uuid) to authenticated;
grant execute on function public.is_privileged() to authenticated;
grant execute on function public.is_admin() to authenticated;
