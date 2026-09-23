-- 0004_pending_invite.sql
-- 1) Detect a pending invite during onboarding — by token (from a /join link,
--    which may have been claimed with a different Google email) or by the
--    signed-in user's email. The invitee isn't a team member yet, so RLS on
--    invites won't surface it; this SECURITY DEFINER lookup does, safely.
-- 2) team_overview returns IL-earned / OT-day numbers instead of a preformatted
--    string, so the UI can render the design's "1 IL · 3 OT" / "—" forms, and
--    decides "out today" by the Philippine date (Tally is PH-only).

create or replace function public.my_pending_invite(p_token text default null)
returns table (
  token text,
  team_id uuid,
  team_name text,
  inviter text,
  member_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    i.token,
    i.team_id,
    t.name,
    coalesce(p.name, p.email),
    (select count(*) from public.memberships m where m.team_id = i.team_id)
  from public.invites i
  join public.teams t on t.id = i.team_id
  join public.profiles p on p.id = i.invited_by
  where i.status = 'pending'
    and i.expires_at > now()
    and (
      (p_token is not null and i.token = p_token)
      or (
        p_token is null
        and lower(i.email) = (select lower(email) from public.profiles where id = auth.uid())
      )
    )
  order by i.created_at desc
  limit 1;
$$;

grant execute on function public.my_pending_invite(text) to authenticated;

drop function if exists public.team_overview(int);

create function public.team_overview(p_year int)
returns table (
  user_id uuid, name text, role public.role, is_self boolean,
  out_today boolean, out_type text,
  vl_left numeric, sl_left numeric, il_avail numeric,
  il_earned numeric, ot_days bigint
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
      bool_or(e.kind in ('vl','sl','il_spend','unpaid') and (now() at time zone 'Asia/Manila')::date between e.date_start and e.date_end) as out_today,
      max(case when e.kind in ('vl','sl','il_spend','unpaid') and (now() at time zone 'Asia/Manila')::date between e.date_start and e.date_end
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
    a.il_earned,
    a.ot_days
  from agg a
  join public.profiles p on p.id = a.user_id
  order by (a.role = 'admin') desc, a.role, p.name;
$$;

grant execute on function public.team_overview(int) to authenticated;
