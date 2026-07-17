-- ============================================================
-- EXELERIS DATABASE UPGRADE — AI Completeness Report
-- Paste this ENTIRE file into the Supabase SQL Editor and click "Run".
-- Run it ONCE, after setup.sql and bidding_upgrade.sql. It only ADDS one
-- column — it will not touch your accounts, projects, or bids.
--
-- If you see "column already exists", that's fine — it means this file was
-- already run. It is safe to run again.
-- ============================================================

-- Stores the AI's analysis of the uploaded deliverable (title, category,
-- summary, honest completeness %, remaining work, skills, budget range and
-- the questions an expert would ask). Kept alongside the project so the
-- "AI Completeness Report" can be shown to experts on the project page.
--
-- No new security rules are needed: the existing "projects" read rules already
-- decide who can see a project, and this column travels with the row. It is
-- readable by anyone who can already read the project (i.e. published projects
-- are public, drafts stay private to their owner).
alter table public.projects
  add column if not exists ai_analysis jsonb;

comment on column public.projects.ai_analysis is
  'AI analysis of the uploaded deliverable (see AI_FEATURE_SETUP.md). Null when the business posted without the AI step.';

-- ============================================================
-- Done. Your projects can now store an AI Completeness Report.
-- ============================================================
