-- ============================================================
-- EXELERIS DATABASE SETUP
-- Paste this ENTIRE file into the Supabase SQL Editor and click "Run".
-- Run it once on a fresh Supabase project.
-- Part 1: types, tables, security rules, signup trigger, file storage
-- Part 2 (bottom of file): sample marketplace projects
-- ============================================================

-- ------------------------------------------------------------
-- 1) Types
-- ------------------------------------------------------------
create type public.app_role as enum ('business', 'expert', 'super_admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.project_status as enum ('draft', 'published');

-- ------------------------------------------------------------
-- 2) Tables
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role public.app_role not null default 'business',
  company_name text,
  created_at timestamptz not null default now()
);

create table public.expert_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  professional_type text,
  license_number text,
  years_experience text,
  skills text[] not null default '{}',
  categories text[] not null default '{}',
  approval_status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.profiles(id) on delete cascade,
  company_name text not null default '',
  title text not null,
  category text not null,
  description text not null default '',
  completion_percent integer not null default 80
    check (completion_percent between 0 and 100),
  skills text[] not null default '{}',
  ai_tools text[] not null default '{}',
  budget_min numeric not null default 0,
  budget_max numeric not null default 0,
  deadline date,
  status public.project_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  expert_id uuid not null references public.profiles(id) on delete cascade,
  hourly_rate numeric not null,
  estimated_hours numeric not null,
  completion_time text,
  approach text,
  experience text,
  questions text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (project_id, expert_id)
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  is_confidential boolean not null default false,
  created_at timestamptz not null default now()
);

create index projects_status_idx on public.projects (status);
create index projects_business_idx on public.projects (business_id);
create index bids_project_idx on public.bids (project_id);
create index bids_expert_idx on public.bids (expert_id);
create index project_files_project_idx on public.project_files (project_id);

-- ------------------------------------------------------------
-- 3) Role helper functions
-- (security definer so policies can check roles without recursion)
-- ------------------------------------------------------------
create or replace function public.get_my_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_approved_expert()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.expert_profiles
    where id = auth.uid() and approval_status = 'approved'
  )
$$;

-- ------------------------------------------------------------
-- 4) Automatic profile creation on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SECURITY: only 'business' or 'expert' may be self-assigned at signup.
  -- Anything else (including 'super_admin' or a bad value) becomes 'business'.
  -- Super admins are promoted manually via SQL (see SETUP_GUIDE.md), never
  -- from client-supplied metadata. This also prevents a bad cast from
  -- aborting the whole signup.
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
      (id, headline, professional_type, license_number, years_experience, skills, categories)
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
      )
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 5) Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.bids enable row level security;
alter table public.project_files enable row level security;

-- profiles: you can see and edit yourself; super admins see everyone.
-- Nobody can change their own role (the new row's role must match the old one).
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.get_my_role() = 'super_admin');

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.get_my_role());

create policy "profiles_admin_update" on public.profiles
  for update using (public.get_my_role() = 'super_admin');

-- expert_profiles: experts see their own; only super admins can change them
-- (this is what prevents an expert from approving themselves).
create policy "expert_profiles_select_own_or_admin" on public.expert_profiles
  for select using (id = auth.uid() or public.get_my_role() = 'super_admin');

create policy "expert_profiles_admin_update" on public.expert_profiles
  for update using (public.get_my_role() = 'super_admin');

-- projects: published projects are visible to everyone (the public job board);
-- drafts only to their owner; super admins see all.
create policy "projects_select_published_or_own" on public.projects
  for select using (
    status = 'published'
    or business_id = auth.uid()
    or public.get_my_role() = 'super_admin'
  );

create policy "projects_insert_business" on public.projects
  for insert with check (
    business_id = auth.uid() and public.get_my_role() = 'business'
  );

create policy "projects_update_own_or_admin" on public.projects
  for update using (
    business_id = auth.uid() or public.get_my_role() = 'super_admin'
  );

create policy "projects_delete_own_or_admin" on public.projects
  for delete using (
    business_id = auth.uid() or public.get_my_role() = 'super_admin'
  );

-- bids: only APPROVED experts may bid, only on published projects, one bid
-- per project; visible to the bidding expert, the project owner, and admins.
create policy "bids_insert_approved_expert" on public.bids
  for insert with check (
    expert_id = auth.uid()
    and public.is_approved_expert()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.status = 'published'
    )
  );

create policy "bids_select_own_or_project_owner_or_admin" on public.bids
  for select using (
    expert_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.business_id = auth.uid()
    )
    or public.get_my_role() = 'super_admin'
  );

create policy "bids_delete_own" on public.bids
  for delete using (expert_id = auth.uid());

-- project_files: the project owner and admins always see them; other
-- signed-in users only see NON-confidential files of PUBLISHED projects.
create policy "project_files_select" on public.project_files
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.business_id = auth.uid()
          or public.get_my_role() = 'super_admin'
          or (p.status = 'published' and not is_confidential and auth.uid() is not null)
        )
    )
  );

create policy "project_files_insert_owner" on public.project_files
  for insert with check (
    -- The stored path MUST live in this project's own folder ("<project id>/...").
    -- Without this, an owner could register a row pointing at another project's
    -- folder and, via the read policy below, pull that project's files.
    split_part(storage_path, '/', 1) = project_id::text
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.business_id = auth.uid()
    )
  );

create policy "project_files_delete_owner_or_admin" on public.project_files
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.business_id = auth.uid() or public.get_my_role() = 'super_admin')
    )
  );

-- ------------------------------------------------------------
-- 6) File storage (private bucket; files live at "<project id>/<file name>")
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "storage_upload_project_owner" on storage.objects
  for insert with check (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.business_id = auth.uid()
    )
  );

create policy "storage_read_project_files" on storage.objects
  for select using (
    bucket_id = 'project-files'
    and exists (
      select 1
      from public.project_files pf
      join public.projects p on p.id = pf.project_id
      where pf.storage_path = name
        and (
          p.business_id = auth.uid()
          or public.get_my_role() = 'super_admin'
          or (p.status = 'published' and not pf.is_confidential and auth.uid() is not null)
        )
    )
  );

create policy "storage_delete_project_owner" on storage.objects
  for delete using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and (p.business_id = auth.uid() or public.get_my_role() = 'super_admin')
    )
  );

-- Part 2: sample marketplace projects (the 30 original example jobs)
insert into public.projects (business_id, company_name, title, category, description, completion_percent, skills, ai_tools, budget_min, budget_max, deadline, status, created_at) values
  (null, 'TechStart Inc.', 'Contract Review - SaaS Terms of Service', 'Legal Services', 'AI-generated Terms of Service for SaaS platform needs legal review and compliance verification. Document is 85% complete with standard clauses in place.', 85, array['Contract Law','SaaS Legal','Terms of Service'], array['GPT-4','Legal AI'], 320, 480, current_date + 2, 'published', now() - interval '2 hours'),
  (null, 'Growth Ventures', 'Financial Model Validation - Series A Fundraising', 'Financial Analysis', 'AI-built financial projection model for Series A fundraising needs expert validation, stress testing, and investor-ready formatting.', 90, array['Financial Modeling','Valuation','Fundraising'], array['Claude','Excel AI'], 600, 1000, current_date + 3, 'published', now() - interval '4 hours'),
  (null, 'DataFlow Solutions', 'Brand Strategy Finalization - B2B SaaS Rebrand', 'Marketing Strategy', 'AI-developed brand strategy and messaging framework needs expert refinement, competitive analysis validation, and go-to-market alignment.', 75, array['Brand Strategy','B2B Marketing','Messaging'], array['Jasper','Brand AI'], 400, 720, current_date + 4, 'published', now() - interval '1 day'),
  (null, 'Industrial Dynamics', 'Operational Process Optimization - Manufacturing', 'Business Consulting', 'AI-generated process improvement recommendations for manufacturing operations need expert validation, implementation planning, and ROI analysis.', 80, array['Operations','Process Optimization','Manufacturing'], array['Custom AI','Process Mining AI'], 800, 1200, current_date, 'published', now() - interval '1 day'),
  (null, 'Enterprise Corp', 'System Architecture Review - Cloud Migration', 'Technical & Engineering', 'AI-designed cloud migration architecture needs expert security review, scalability validation, and implementation roadmap finalization.', 85, array['Cloud Architecture','Security','Migration'], array['Copilot','Architecture AI'], 1000, 1600, current_date + 3, 'published', now() - interval '2 days'),
  (null, 'BioPharma Research', 'Clinical Protocol Development - Phase II Trial', 'Healthcare & Medical', 'AI-generated clinical trial protocol for Phase II study needs expert medical review, regulatory compliance check, and statistical design validation.', 70, array['Clinical Research','Regulatory Affairs','Protocol Design'], array['Medical AI','Protocol Builder'], 1200, 2000, current_date + 4, 'published', now() - interval '3 days'),
  (null, 'PayFlow', 'Brand Identity Design System - Fintech Startup', 'Design & Creative', 'AI-created brand identity and design system needs expert refinement, accessibility compliance, and brand guideline documentation.', 80, array['Brand Design','Design Systems','Fintech'], array['Midjourney','Figma AI'], 480, 800, current_date + 2, 'published', now() - interval '4 days'),
  (null, 'Retail Insights Co', 'Market Research Analysis - Consumer Behavior Study', 'Academic & Research', 'AI-processed consumer behavior research needs expert statistical validation, insight synthesis, and executive summary preparation.', 85, array['Market Research','Statistical Analysis','Consumer Behavior'], array['Research AI','Statistical Tools'], 720, 1120, current_date + 3, 'published', now() - interval '5 days'),
  (null, 'Innovation Labs', 'IP Patent Application - IoT Device', 'Legal Services', 'AI-drafted patent application for IoT sensing device needs expert patent attorney review, claims refinement, and prior art analysis.', 75, array['IP Law','Patent Law','IoT Technology'], array['Patent AI','Legal Research'], 880, 1400, current_date + 4, 'published', now() - interval '7 days'),
  (null, 'RoboTech Innovations', 'Investment Pitch Deck - Hardware Startup', 'Financial Analysis', 'AI-generated investor pitch deck needs expert refinement, financial narrative strengthening, and presentation flow optimization.', 80, array['Investment Analysis','Pitch Development','Hardware'], array['Pitch AI','Financial Modeling'], 600, 880, current_date + 1, 'published', now() - interval '7 days'),
  (null, 'MarketGrow Agency', 'Content Marketing Strategy - B2B Lead Generation', 'Marketing Strategy', 'AI-developed content marketing strategy for B2B lead generation needs expert campaign optimization and conversion funnel refinement.', 85, array['Content Marketing','Lead Generation','B2B'], array['Content AI','Marketing Tools'], 400, 640, current_date + 2, 'published', now() - interval '7 days'),
  (null, 'Legacy Systems Inc', 'Change Management Plan - Digital Transformation', 'Business Consulting', 'AI-created change management framework for digital transformation needs expert stakeholder analysis and implementation timeline optimization.', 70, array['Change Management','Digital Transformation','Stakeholder Management'], array['Transformation AI','Planning Tools'], 1120, 1680, current_date + 3, 'published', now() - interval '7 days'),
  (null, 'DevTools Pro', 'API Documentation - Developer Portal', 'Technical & Engineering', 'AI-generated API documentation needs expert technical writing review, code example validation, and developer experience optimization.', 90, array['Technical Writing','API Design','Developer Experience'], array['Documentation AI','Code Analysis'], 320, 560, current_date + 1, 'published', now() - interval '7 days'),
  (null, 'MedDevice Innovations', 'Medical Device Compliance Report - FDA Submission', 'Healthcare & Medical', 'AI-compiled FDA compliance documentation for Class II medical device needs expert regulatory review and submission preparation.', 75, array['Medical Device','FDA Compliance','Regulatory Affairs'], array['Regulatory AI','Compliance Tools'], 1600, 2400, current_date + 4, 'published', now() - interval '14 days'),
  (null, 'AppFlow Design', 'UX Research Report - Mobile App Redesign', 'Design & Creative', 'AI-analyzed UX research data needs expert insight synthesis, design recommendation refinement, and user journey optimization.', 85, array['UX Research','Mobile Design','User Testing'], array['UX AI','Research Tools'], 480, 760, current_date + 2, 'published', now() - interval '14 days'),
  (null, 'Green Innovation Lab', 'Grant Proposal - Clean Energy Research', 'Academic & Research', 'AI-drafted NSF grant proposal for clean energy research needs expert academic review, methodology validation, and budget justification.', 80, array['Grant Writing','Clean Energy','Research Methods'], array['Grant AI','Research Tools'], 1000, 1600, current_date + 4, 'published', now() - interval '14 days'),
  (null, 'DistributedCorp', 'Employee Handbook - Remote Work Policies', 'Legal Services', 'AI-generated employee handbook with remote work policies needs legal compliance review and state-specific regulation alignment.', 85, array['Employment Law','Remote Work','HR Policy'], array['Legal AI','Policy Builder'], 400, 720, current_date + 3, 'published', now() - interval '14 days'),
  (null, 'CryptoFund Capital', 'Risk Assessment Model - Cryptocurrency Trading', 'Financial Analysis', 'AI-built risk assessment model for crypto trading strategies needs expert validation, stress testing, and regulatory compliance review.', 75, array['Risk Assessment','Cryptocurrency','Quantitative Analysis'], array['Quant AI','Risk Modeling'], 1400, 2200, current_date + 3, 'published', now() - interval '21 days'),
  (null, 'GlowUp Cosmetics', 'Influencer Marketing Campaign - Beauty Brand', 'Marketing Strategy', 'AI-designed influencer marketing campaign strategy needs expert creator matching, contract template review, and ROI optimization.', 80, array['Influencer Marketing','Beauty Industry','Social Media'], array['Social AI','Campaign Builder'], 560, 840, current_date + 2, 'published', now() - interval '21 days'),
  (null, 'Enterprise Solutions', 'Agile Transformation Roadmap - Enterprise', 'Business Consulting', 'AI-created agile transformation roadmap for enterprise organization needs expert methodology validation and implementation planning.', 70, array['Agile Methodology','Enterprise Transformation','Project Management'], array['Agile AI','Transformation Tools'], 1800, 2800, current_date + 4, 'published', now() - interval '21 days'),
  (null, 'ShopFlow Tech', 'Microservices Architecture - E-commerce Platform', 'Technical & Engineering', 'AI-designed microservices architecture for high-traffic e-commerce platform needs expert scalability review and deployment strategy.', 85, array['Microservices','E-commerce','Scalability'], array['Architecture AI','System Design'], 1200, 1800, current_date + 3, 'published', now() - interval '21 days'),
  (null, 'Cancer Research Institute', 'Clinical Data Analysis - Oncology Trial', 'Healthcare & Medical', 'AI-processed clinical trial data for oncology study needs expert statistical analysis validation and regulatory reporting preparation.', 80, array['Clinical Data','Oncology','Biostatistics'], array['Clinical AI','Statistical Tools'], 2000, 3200, current_date + 4, 'published', now() - interval '30 days'),
  (null, 'EcoWear Collective', 'Visual Identity - Sustainable Fashion Brand', 'Design & Creative', 'AI-generated visual identity for sustainable fashion brand needs expert sustainability messaging integration and brand story refinement.', 75, array['Sustainable Design','Fashion Branding','Visual Identity'], array['Brand AI','Visual Tools'], 720, 1120, current_date + 3, 'published', now() - interval '30 days'),
  (null, 'EdTech Research Group', 'Literature Review - AI in Education', 'Academic & Research', 'AI-compiled literature review on AI applications in education needs expert academic validation, gap analysis, and research framework.', 85, array['Educational Research','AI Applications','Literature Review'], array['Research AI','Academic Tools'], 800, 1280, current_date + 4, 'published', now() - interval '30 days'),
  (null, 'HealthTrack Solutions', 'Privacy Policy - Healthcare App', 'Legal Services', 'AI-generated privacy policy for healthcare mobile app needs HIPAA compliance review and state privacy law alignment.', 80, array['Privacy Law','HIPAA','Healthcare'], array['Legal AI','Privacy Tools'], 480, 800, current_date + 2, 'published', now() - interval '30 days'),
  (null, 'Growth Capital Partners', 'Merger Model - Tech Acquisition', 'Financial Analysis', 'AI-built merger and acquisition financial model needs expert due diligence validation, synergy analysis, and valuation refinement.', 75, array['M&A Analysis','Valuation','Due Diligence'], array['Financial AI','M&A Tools'], 1600, 2600, current_date + 4, 'published', now() - interval '30 days'),
  (null, 'DataViz Pro', 'Product Launch Strategy - AI-Powered Analytics', 'Marketing Strategy', 'AI-developed product launch strategy for analytics platform needs expert market positioning, competitive analysis, and GTM optimization.', 80, array['Product Launch','B2B SaaS','Analytics'], array['Strategy AI','Market Tools'], 880, 1360, current_date + 3, 'published', now() - interval '30 days'),
  (null, 'SecureBank Corp', 'Cybersecurity Framework - Financial Services', 'Technical & Engineering', 'AI-designed cybersecurity framework for financial institution needs expert threat modeling, compliance validation, and incident response planning.', 70, array['Cybersecurity','Financial Services','Compliance'], array['Security AI','Framework Tools'], 2200, 3400, current_date + 4, 'published', now() - interval '30 days'),
  (null, 'RareCure Therapeutics', 'Pharmaceutical Market Access - Rare Disease', 'Healthcare & Medical', 'AI-generated market access strategy for rare disease therapy needs expert payer landscape analysis and reimbursement strategy refinement.', 75, array['Market Access','Rare Disease','Reimbursement'], array['Pharma AI','Market Access Tools'], 2400, 3600, current_date + 4, 'published', now() - interval '30 days'),
  (null, 'Climate Research Consortium', 'Meta-Analysis - Climate Change Impacts', 'Academic & Research', 'AI-conducted meta-analysis of climate change impact studies needs expert statistical validation, bias assessment, and publication preparation.', 85, array['Meta-Analysis','Climate Science','Statistical Methods'], array['Meta-Analysis AI','Statistical Tools'], 1400, 2080, current_date + 4, 'published', now() - interval '30 days');
