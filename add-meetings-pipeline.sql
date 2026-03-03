-- ============================================================
--  PULSE — Meetings & Pipeline migration
--  Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Pipeline flag on projects ─────────────────────────────
alter table public.projects
  add column if not exists is_pipeline boolean default false;

-- Index for fast pipeline filtering
create index if not exists projects_pipeline_idx on public.projects(workspace_id, is_pipeline);


-- ── 2. Project meetings ───────────────────────────────────────
create table if not exists public.project_meetings (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete cascade not null,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  created_by    uuid references auth.users(id) on delete set null,
  title         text not null,
  meeting_date  date,
  attendees     text,
  summary       text,
  action_count  int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists meetings_project_idx   on public.project_meetings(project_id);
create index if not exists meetings_workspace_idx on public.project_meetings(workspace_id);

-- Auto-update updated_at
drop trigger if exists meetings_set_updated_at on public.project_meetings;
create trigger meetings_set_updated_at
  before update on public.project_meetings
  for each row execute function public.set_updated_at();


-- ── 3. Meeting action items ───────────────────────────────────
create table if not exists public.meeting_actions (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid references public.project_meetings(id) on delete cascade not null,
  action      text not null,
  owner       text,
  due_date    date,
  priority    text default 'medium' check (priority in ('high', 'medium', 'low')),
  done        boolean default false,
  created_at  timestamptz default now()
);

create index if not exists actions_meeting_idx on public.meeting_actions(meeting_id);


-- ── 4. RLS ───────────────────────────────────────────────────
alter table public.project_meetings enable row level security;
alter table public.meeting_actions   enable row level security;

-- project_meetings
drop policy if exists "Members can view meetings"   on public.project_meetings;
drop policy if exists "Members can create meetings" on public.project_meetings;
drop policy if exists "Members can update meetings" on public.project_meetings;
drop policy if exists "Members can delete meetings" on public.project_meetings;

create policy "Members can view meetings"
  on public.project_meetings for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create meetings"
  on public.project_meetings for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update meetings"
  on public.project_meetings for update to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete meetings"
  on public.project_meetings for delete to authenticated
  using (public.is_workspace_member(workspace_id));

-- meeting_actions
drop policy if exists "Members can view actions"   on public.meeting_actions;
drop policy if exists "Members can manage actions" on public.meeting_actions;

create policy "Members can view actions"
  on public.meeting_actions for select to authenticated
  using (exists (
    select 1 from public.project_meetings m
    where m.id = meeting_actions.meeting_id
    and public.is_workspace_member(m.workspace_id)
  ));

create policy "Members can manage actions"
  on public.meeting_actions for all to authenticated
  using (exists (
    select 1 from public.project_meetings m
    where m.id = meeting_actions.meeting_id
    and public.is_workspace_member(m.workspace_id)
  ))
  with check (exists (
    select 1 from public.project_meetings m
    where m.id = meeting_actions.meeting_id
    and public.is_workspace_member(m.workspace_id)
  ));

-- ── Done ─────────────────────────────────────────────────────
-- Run this once. Safe to re-run (all IF NOT EXISTS guarded).
