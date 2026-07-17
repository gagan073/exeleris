-- ============================================================
-- EXELERIS DATABASE UPGRADE — Bidding, Comparison, Accept & Notifications
-- Paste this ENTIRE file into the Supabase SQL Editor and click "Run".
-- Run it ONCE, after setup.sql. It only ADDS things — it will not touch
-- your existing accounts or your 30 sample projects.
--
-- If you ever see a message that something "already exists", that's fine —
-- it just means this file was already run. It is safe to run again.
-- ============================================================

-- Lets us create functions that mention the new statuses below without
-- Postgres validating them mid-migration (they're checked when they run).
set check_function_bodies = off;

-- ------------------------------------------------------------
-- 1) New project statuses (kept alongside the existing draft/published)
-- ------------------------------------------------------------
alter type public.project_status add value if not exists 'in_progress';
alter type public.project_status add value if not exists 'in_review';
alter type public.project_status add value if not exists 'completed';
alter type public.project_status add value if not exists 'cancelled';

-- ------------------------------------------------------------
-- 1b) Helper functions used by the security rules below.
--     They run with elevated rights so a rule on one table can safely check
--     another table WITHOUT the two rules calling each other forever
--     (the same pattern as get_my_role() in setup.sql).
-- ------------------------------------------------------------
-- Has the current user placed a bid on this project?
create or replace function public.has_bid_on(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bids
    where project_id = p_project_id and expert_id = auth.uid()
  )
$$;
grant execute on function public.has_bid_on(uuid) to anon, authenticated;

-- Is this expert someone who has bid on one of the current user's projects?
create or replace function public.is_my_bidder(p_expert_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bids b
    join public.projects p on p.id = b.project_id
    where b.expert_id = p_expert_id and p.business_id = auth.uid()
  )
$$;
grant execute on function public.is_my_bidder(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- 2) Bid fields for the new "price for the whole job" model
-- ------------------------------------------------------------
alter table public.bids add column if not exists bid_amount numeric;
alter table public.bids add column if not exists estimated_completion_date date;
alter table public.bids add column if not exists decline_reason text;

-- Fill in bid_amount for any existing test bids (old model = rate x hours),
-- then require it going forward. COALESCE guarantees no NULLs remain.
update public.bids
  set bid_amount = round(coalesce(hourly_rate, 0) * coalesce(estimated_hours, 0), 2)
  where bid_amount is null;
alter table public.bids alter column bid_amount set not null;

-- The old hourly_rate is no longer required (left in place, unused).
alter table public.bids alter column hourly_rate drop not null;

-- Keep bid status to a known set of values.
alter table public.bids drop constraint if exists bids_status_check;
alter table public.bids add constraint bids_status_check
  check (status in ('pending', 'shortlisted', 'accepted', 'declined', 'withdrawn'));

create index if not exists bids_status_idx on public.bids (status);

-- Experts may edit their OWN bid while it is still Pending (they cannot
-- change the status themselves — that keeps them from self-accepting).
drop policy if exists "bids_update_own_pending" on public.bids;
create policy "bids_update_own_pending" on public.bids
  for update using (expert_id = auth.uid() and status = 'pending')
  with check (expert_id = auth.uid() and status = 'pending');

-- An expert who has bid on a project can always see that project — even after
-- it leaves the public board (e.g. once it moves to In Progress). This powers
-- "My Bids" and the expert's "Active Projects" list.
drop policy if exists "projects_select_bidders" on public.projects;
create policy "projects_select_bidders" on public.projects
  for select using (public.has_bid_on(id));

-- A business can read the name + headline of experts who have bid on THEIR
-- projects (needed for the side-by-side bid comparison screen). Scoped tightly
-- to just those bidders — a business cannot browse other users' profiles.
drop policy if exists "profiles_select_my_bidders" on public.profiles;
create policy "profiles_select_my_bidders" on public.profiles
  for select using (public.is_my_bidder(id));

drop policy if exists "expert_profiles_select_my_bidders" on public.expert_profiles;
create policy "expert_profiles_select_my_bidders" on public.expert_profiles
  for select using (public.is_my_bidder(id));

-- ------------------------------------------------------------
-- 3) Platform settings (single row) — the commission % lives here so the
--    Super Admin can change it later without touching code.
-- ------------------------------------------------------------
create table if not exists public.platform_settings (
  id boolean primary key default true check (id),  -- forces exactly one row
  commission_percent numeric not null default 15
    check (commission_percent >= 0 and commission_percent <= 100),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
drop policy if exists "platform_settings_select_all" on public.platform_settings;
create policy "platform_settings_select_all" on public.platform_settings
  for select using (true);
drop policy if exists "platform_settings_admin_update" on public.platform_settings;
create policy "platform_settings_admin_update" on public.platform_settings
  for update using (public.get_my_role() = 'super_admin')
  with check (public.get_my_role() = 'super_admin');

-- ------------------------------------------------------------
-- 4) Transactions — the permanent money record for every accepted bid.
--    Rows are only ever written by accept_bid() below.
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  winning_bid_id uuid references public.bids(id) on delete set null,
  business_id uuid references public.profiles(id) on delete set null,
  expert_id uuid references public.profiles(id) on delete set null,
  total_amount numeric not null,
  commission_percent numeric not null,   -- the % used at the moment of accept
  platform_earnings numeric not null,
  expert_payout numeric not null,
  status text not null default 'recorded',
  created_at timestamptz not null default now()
);
create index if not exists transactions_business_idx on public.transactions (business_id);
create index if not exists transactions_expert_idx on public.transactions (expert_id);
create index if not exists transactions_project_idx on public.transactions (project_id);

alter table public.transactions enable row level security;
-- Each side sees only their own transactions; admins see all. No insert
-- policy on purpose — only the accept_bid() function may create these.
drop policy if exists "transactions_select_involved" on public.transactions;
create policy "transactions_select_involved" on public.transactions
  for select using (
    business_id = auth.uid()
    or expert_id = auth.uid()
    or public.get_my_role() = 'super_admin'
  );

-- ------------------------------------------------------------
-- 5) Notifications — created server-side (by the triggers below) so nobody
--    can forge a notification for another user.
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null default '',
  link text,
  project_id uuid references public.projects(id) on delete cascade,
  bid_id uuid references public.bids(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, is_read);

alter table public.notifications enable row level security;
-- Users can read and mark-read only their own. No insert policy — the
-- triggers (which run with elevated rights) create them.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 6) accept_bid() — the atomic "choose a winner" step.
--    Runs as one all-or-nothing action so the money record can never
--    half-write. Verifies the caller owns the project and it's still open.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 7) set_bid_status() — business Shortlist / standalone Decline (+ reason)
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 8) withdraw_bid() — expert withdraws their own still-open bid
-- ------------------------------------------------------------
create or replace function public.withdraw_bid(p_bid_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bids set status = 'withdrawn'
    where id = p_bid_id
      and expert_id = auth.uid()
      and status in ('pending', 'shortlisted');
  if not found then raise exception 'This bid cannot be withdrawn'; end if;
end;
$$;
grant execute on function public.withdraw_bid(uuid) to authenticated;

-- ------------------------------------------------------------
-- 9) Notification triggers (server-side, so they can notify OTHER users)
-- ------------------------------------------------------------
-- New bid -> notify the business that owns the project.
create or replace function public.notify_new_bid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business uuid;
  v_title text;
begin
  select business_id, title into v_business, v_title
    from public.projects where id = new.project_id;
  if v_business is not null then
    insert into public.notifications (user_id, type, title, message, link, project_id, bid_id)
    values (
      v_business,
      'new_bid',
      'New bid received',
      'You received a new bid on "' || coalesce(v_title, 'your project') || '".',
      '/project/' || new.project_id || '/bids',
      new.project_id,
      new.id
    );
  end if;
  return new;
end;
$$;

-- Bid accepted/declined -> notify the expert who placed it.
create or replace function public.notify_bid_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.status in ('accepted', 'declined') then
    select title into v_title from public.projects where id = new.project_id;
    insert into public.notifications (user_id, type, title, message, link, project_id, bid_id)
    values (
      new.expert_id,
      case when new.status = 'accepted' then 'bid_accepted' else 'bid_declined' end,
      case when new.status = 'accepted' then 'Bid accepted 🎉' else 'Bid declined' end,
      case when new.status = 'accepted'
        then 'Your bid on "' || coalesce(v_title, 'a project') || '" was accepted.'
        else 'Your bid on "' || coalesce(v_title, 'a project') || '" was declined.'
      end,
      '/dashboard',
      new.project_id,
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_bid_created on public.bids;
create trigger on_bid_created
  after insert on public.bids
  for each row execute function public.notify_new_bid();

drop trigger if exists on_bid_status_changed on public.bids;
create trigger on_bid_status_changed
  after update on public.bids
  for each row when (old.status is distinct from new.status)
  execute function public.notify_bid_status_change();

-- ------------------------------------------------------------
-- 10) Show confidential documents as "locked" on the project detail page.
--     This lets a signed-in expert SEE that a confidential file exists (its
--     name) on a published project, while the actual file stays locked — the
--     storage download rule (set in setup.sql) still blocks it for everyone
--     except the project owner and admins.
-- ------------------------------------------------------------
drop policy if exists "project_files_select" on public.project_files;
create policy "project_files_select" on public.project_files
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.business_id = auth.uid()
          or public.get_my_role() = 'super_admin'
          or (p.status = 'published' and auth.uid() is not null)
        )
    )
  );

-- ============================================================
-- Done. Your marketplace can now take real bids, compare them, pick a
-- winner, record the money split, and notify both sides.
-- ============================================================
