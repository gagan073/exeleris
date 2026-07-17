-- ============================================================
-- EXELERIS — quick fix for the bidding security rules
-- Run this ONCE in the Supabase SQL Editor, right after bidding_upgrade.sql.
--
-- Why: three of the new rules referenced each other in a loop ("projects"
-- checks "bids", "bids" checks "projects"), which Postgres rejects as
-- "infinite recursion". This replaces them with the same safe helper-function
-- pattern already used elsewhere in your database. Safe to run more than once.
-- ============================================================

-- Helper: has the current user bid on this project?
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

-- Helper: is this expert someone who bid on one of the current user's projects?
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

-- Recreate the three rules using the helpers (no more loop).
drop policy if exists "projects_select_bidders" on public.projects;
create policy "projects_select_bidders" on public.projects
  for select using (public.has_bid_on(id));

drop policy if exists "profiles_select_my_bidders" on public.profiles;
create policy "profiles_select_my_bidders" on public.profiles
  for select using (public.is_my_bidder(id));

drop policy if exists "expert_profiles_select_my_bidders" on public.expert_profiles;
create policy "expert_profiles_select_my_bidders" on public.expert_profiles
  for select using (public.is_my_bidder(id));

-- ============================================================
-- Done. The bidding security rules are now recursion-free.
-- ============================================================
