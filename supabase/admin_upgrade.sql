-- ============================================================
-- EXELERIS DATABASE UPGRADE — Super Admin area
-- Paste this ENTIRE file into the Supabase SQL Editor and click "Run".
-- Run it ONCE, after setup.sql + bidding_upgrade.sql (+ bidding_fix.sql).
-- It only ADDS things — it will not touch your accounts, projects, bids,
-- or money records.
--
-- If you ever see a message that something "already exists", that's fine —
-- it just means this file was already run. It is safe to run again.
-- ============================================================

-- Lets us (re)create functions that mention statuses/columns without Postgres
-- validating the bodies mid-migration (they're checked when they actually run).
set check_function_bodies = off;

-- ------------------------------------------------------------
-- 1) New columns
-- ------------------------------------------------------------
-- Deactivate / reactivate an account. A deactivated person is signed out by
-- the app and blocked by the rules below from posting, bidding, or accepting.
alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- When the expert ticked "I agree to the Transparency Manifesto" at signup.
alter table public.expert_profiles
  add column if not exists manifesto_agreed_at timestamptz;

-- The reason the Super Admin gave when rejecting an expert (also sent to the
-- expert as a notification). Null unless/until they were rejected with a note.
alter table public.expert_profiles
  add column if not exists rejection_reason text;

-- ------------------------------------------------------------
-- 2) Helper: is the current user active?
--    Security-definer so the rules below can check it without recursion
--    (the same safe pattern as get_my_role() / is_approved_expert()).
--    Defaults to TRUE when there is no profile row yet, so signup is unaffected.
-- ------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_active from public.profiles where id = auth.uid()),
    true
  )
$$;
grant execute on function public.is_active_user() to anon, authenticated;

-- ------------------------------------------------------------
-- 3) Commission change history — one row per change, for the Settings screen.
--    Written only by set_commission_percent() below.
-- ------------------------------------------------------------
create table if not exists public.commission_history (
  id uuid primary key default gen_random_uuid(),
  changed_by uuid references public.profiles(id) on delete set null,
  old_percent numeric not null,
  new_percent numeric not null,
  changed_at timestamptz not null default now()
);
create index if not exists commission_history_changed_at_idx
  on public.commission_history (changed_at desc);

alter table public.commission_history enable row level security;
-- Only the Super Admin can read the history. No insert policy on purpose —
-- only set_commission_percent() (which runs with elevated rights) writes here.
drop policy if exists "commission_history_select_admin" on public.commission_history;
create policy "commission_history_select_admin" on public.commission_history
  for select using (public.get_my_role() = 'super_admin');

-- ------------------------------------------------------------
-- 4) Record manifesto agreement at signup.
--    Recreates handle_new_user() (from setup.sql) with one added column:
--    expert_profiles.manifesto_agreed_at. Everything else is unchanged.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SECURITY: only 'business' or 'expert' may be self-assigned at signup.
  -- Anything else (including 'super_admin') falls back to 'business'.
  insert into public.profiles (id, full_name, email, role, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    case
      when new.raw_user_meta_data ->> 'role' = 'expert' then 'expert'::public.app_role
      else 'business'::public.app_role
    end,
    new.raw_user_meta_data ->> 'company_name'
  );

  if (new.raw_user_meta_data ->> 'role') = 'expert' then
    insert into public.expert_profiles
      (id, headline, professional_type, license_number, years_experience,
       skills, categories, manifesto_agreed_at)
    values (
      new.id,
      new.raw_user_meta_data ->> 'headline',
      new.raw_user_meta_data ->> 'professional_type',
      new.raw_user_meta_data ->> 'license_number',
      new.raw_user_meta_data ->> 'years_experience',
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data -> 'skills') as t(x)),
        '{}'
      ),
      coalesce(
        (select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data -> 'categories') as t(x)),
        '{}'
      ),
      -- Stamp the agreement time only if the signup form recorded it.
      case
        when (new.raw_user_meta_data ->> 'manifesto_agreed') = 'true' then now()
        else null
      end
    );
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 5) review_expert() — Approve or Reject a pending expert AND notify them.
--    Notifications can only be created server-side, so this runs with elevated
--    rights. Only the Super Admin may call it.
-- ------------------------------------------------------------
create or replace function public.review_expert(
  p_expert_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text;
begin
  if public.get_my_role() <> 'super_admin' then
    raise exception 'Only an administrator can review experts';
  end if;
  if p_status not in ('approved', 'rejected') then
    raise exception 'Status must be approved or rejected';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  update public.expert_profiles
    set approval_status = p_status::public.approval_status,
        rejection_reason = case when p_status = 'rejected' then v_reason else null end
    where id = p_expert_id;
  if not found then raise exception 'Expert not found'; end if;

  insert into public.notifications (user_id, type, title, message, link)
  values (
    p_expert_id,
    case when p_status = 'approved' then 'expert_approved' else 'expert_rejected' end,
    case when p_status = 'approved' then 'Application approved 🎉'
         else 'Application not approved' end,
    case
      when p_status = 'approved'
        then 'Congratulations — your expert profile has been approved. You can now place bids on projects.'
      else 'Your expert application was not approved.'
           || coalesce(' Reason: ' || v_reason, '')
           || ' Please contact support if you have questions.'
    end,
    '/dashboard'
  );
end;
$$;
grant execute on function public.review_expert(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- 6) set_commission_percent() — change the live commission AND log the change.
--    accept_bid() already reads this value at accept-time, so a new rate
--    automatically applies to every future accepted bid. Only the Super Admin
--    may call it.
-- ------------------------------------------------------------
create or replace function public.set_commission_percent(p_percent numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old numeric;
begin
  if public.get_my_role() <> 'super_admin' then
    raise exception 'Only an administrator can change the commission';
  end if;
  if p_percent is null or p_percent < 0 or p_percent > 100 then
    raise exception 'Commission must be between 0 and 100';
  end if;

  select commission_percent into v_old from public.platform_settings where id = true;
  v_old := coalesce(v_old, 15);

  update public.platform_settings
    set commission_percent = p_percent, updated_at = now()
    where id = true;

  -- Only record history when the value actually changed.
  if v_old is distinct from p_percent then
    insert into public.commission_history (changed_by, old_percent, new_percent)
    values (auth.uid(), v_old, p_percent);
  end if;
end;
$$;
grant execute on function public.set_commission_percent(numeric) to authenticated;

-- ------------------------------------------------------------
-- 7) set_user_active() — deactivate / reactivate an account.
--    Refuses to deactivate an administrator (which also stops self-lockout).
--    Only the Super Admin may call it.
-- ------------------------------------------------------------
create or replace function public.set_user_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  if public.get_my_role() <> 'super_admin' then
    raise exception 'Only an administrator can change account status';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then raise exception 'User not found'; end if;

  if p_active = false and v_role = 'super_admin' then
    raise exception 'Administrator accounts cannot be deactivated';
  end if;

  update public.profiles set is_active = p_active where id = p_user_id;
end;
$$;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;

-- ------------------------------------------------------------
-- 8) Deactivation teeth — a deactivated user can't act even with a leftover
--    browser session. We recreate the two INSERT rules and the two "action"
--    functions with an is_active_user() check added. Everything else about
--    them is exactly as before.
-- ------------------------------------------------------------
-- Only ACTIVE, APPROVED experts may bid (was: approved experts).
drop policy if exists "bids_insert_approved_expert" on public.bids;
create policy "bids_insert_approved_expert" on public.bids
  for insert with check (
    expert_id = auth.uid()
    and public.is_active_user()
    and public.is_approved_expert()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );

-- Only ACTIVE businesses may post projects.
drop policy if exists "projects_insert_business" on public.projects;
create policy "projects_insert_business" on public.projects
  for insert with check (
    business_id = auth.uid()
    and public.is_active_user()
    and public.get_my_role() = 'business'
  );

-- accept_bid(): same as bidding_upgrade.sql, plus an active-account guard.
create or replace function public.accept_bid(p_bid_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.bids;
  v_project public.projects;
  v_pct numeric;
  v_platform numeric;
  v_payout numeric;
  v_txn uuid;
begin
  if not public.is_active_user() then
    raise exception 'Your account has been deactivated';
  end if;

  select * into v_bid from public.bids where id = p_bid_id;
  if not found then raise exception 'Bid not found'; end if;

  select * into v_project from public.projects where id = v_bid.project_id;
  if not found then raise exception 'Project not found'; end if;

  if v_project.business_id is distinct from auth.uid() then
    raise exception 'You are not allowed to accept bids on this project';
  end if;
  if v_project.status <> 'published' then
    raise exception 'This project is not open for bids';
  end if;
  if v_bid.status not in ('pending', 'shortlisted') then
    raise exception 'This bid can no longer be accepted';
  end if;

  -- Read the current commission (default to 15 if the row is missing).
  select commission_percent into v_pct from public.platform_settings where id = true;
  v_pct := coalesce(v_pct, 15);
  v_platform := round(v_bid.bid_amount * v_pct / 100.0, 2);
  v_payout := v_bid.bid_amount - v_platform;

  -- Winner in, everyone else out, project moves to In Progress.
  update public.bids set status = 'accepted' where id = v_bid.id;
  update public.bids set status = 'declined'
    where project_id = v_bid.project_id
      and id <> v_bid.id
      and status in ('pending', 'shortlisted');
  update public.projects set status = 'in_progress' where id = v_project.id;

  insert into public.transactions
    (project_id, winning_bid_id, business_id, expert_id,
     total_amount, commission_percent, platform_earnings, expert_payout)
  values
    (v_project.id, v_bid.id, v_project.business_id, v_bid.expert_id,
     v_bid.bid_amount, v_pct, v_platform, v_payout)
  returning id into v_txn;

  return v_txn;
end;
$$;
grant execute on function public.accept_bid(uuid) to authenticated;

-- set_bid_status(): same as bidding_upgrade.sql, plus an active-account guard.
create or replace function public.set_bid_status(p_bid_id uuid, p_status text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.bids;
  v_project public.projects;
begin
  if not public.is_active_user() then
    raise exception 'Your account has been deactivated';
  end if;
  if p_status not in ('shortlisted', 'declined') then
    raise exception 'Invalid status';
  end if;

  select * into v_bid from public.bids where id = p_bid_id;
  if not found then raise exception 'Bid not found'; end if;

  select * into v_project from public.projects where id = v_bid.project_id;
  if v_project.business_id is distinct from auth.uid() then
    raise exception 'You are not allowed to change bids on this project';
  end if;
  if v_project.status <> 'published' then
    raise exception 'This project is not open for bids';
  end if;
  if v_bid.status not in ('pending', 'shortlisted') then
    raise exception 'This bid can no longer be updated';
  end if;

  update public.bids
    set status = p_status,
        decline_reason = case when p_status = 'declined' then p_reason else decline_reason end
    where id = p_bid_id;
end;
$$;
grant execute on function public.set_bid_status(uuid, text, text) to authenticated;

-- ============================================================
-- Done. Your Super Admin area now has everything it needs: deactivation,
-- expert approval with notifications, a commission control with history,
-- and the transaction record was already in place.
-- ============================================================
