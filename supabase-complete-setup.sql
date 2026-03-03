-- ============================================================
--  PULSE — COMPLETE SUPABASE SETUP
--  Run this ONCE in Supabase SQL Editor
--  Dashboard → SQL Editor → New Query → Paste All → Run
--
--  This script is SAFE to re-run — all statements use
--  "IF NOT EXISTS" / "IF EXISTS" guards.
--
--  ORDER:
--    1.  Core tables (workspaces, members, projects, tasks)
--    2.  Support tables (comments, notif_settings, notif_logs)
--    3.  Attachments table
--    4.  Row Level Security policies
--    5.  Storage bucket for file attachments
--    6.  Google OAuth note (manual step — see bottom)
-- ============================================================


-- ── 1. WORKSPACES ────────────────────────────────────────────
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  invite_code text unique not null default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at  timestamptz default now()
);


-- ── 2. WORKSPACE MEMBERS ─────────────────────────────────────
create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  role         text default 'member' check (role in ('owner', 'member')),
  full_name    text,
  email        text,
  joined_at    timestamptz default now(),
  primary key  (workspace_id, user_id)
);

-- Index for fast member lookups
create index if not exists workspace_members_workspace_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_idx      on public.workspace_members(user_id);


-- ── 3. PROJECTS ──────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  created_by   uuid references auth.users(id) on delete set null,
  name         text not null,
  description  text,
  color        text default '#3B82F6',
  created_at   timestamptz default now()
);

create index if not exists projects_workspace_idx on public.projects(workspace_id);


-- ── 4. TASKS ─────────────────────────────────────────────────
create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references public.projects(id) on delete cascade not null,
  workspace_id   uuid references public.workspaces(id) on delete cascade not null,
  created_by     uuid references auth.users(id) on delete set null,
  title          text not null,
  status         text default 'new' check (status in ('new', 'inprogress', 'review', 'done')),
  priority       text default 'medium' check (priority in ('high', 'medium', 'low')),
  assignee_name  text,
  assignee_email text,
  due_date       date,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists tasks_project_idx   on public.tasks(project_id);
create index if not exists tasks_workspace_idx on public.tasks(workspace_id);
create index if not exists tasks_assignee_idx  on public.tasks(assignee_email);

-- Auto-update updated_at on any change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();


-- ── 5. COMMENTS ──────────────────────────────────────────────
create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.tasks(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text,
  body        text not null,
  created_at  timestamptz default now()
);

create index if not exists comments_task_idx on public.task_comments(task_id);


-- ── 6. NOTIFICATION SETTINGS ─────────────────────────────────
create table if not exists public.notif_settings (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid references public.workspaces(id) on delete cascade not null unique,
  gmail_client_id     text,
  gmail_access_token  text,
  gmail_email         text,
  enabled_triggers    jsonb default '{"task_assigned":true,"status_changed":true,"task_completed":true,"new_task":false}'::jsonb,
  notify_assignee     boolean default true,
  extra_emails        text default '',
  updated_at          timestamptz default now()
);


-- ── 7. NOTIFICATION LOGS ─────────────────────────────────────
create table if not exists public.notif_logs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  trigger_type text,
  task_id      uuid,
  recipient    text,
  subject      text,
  status       text,
  created_at   timestamptz default now()
);

create index if not exists notif_logs_workspace_idx on public.notif_logs(workspace_id);


-- ── 8. TASK ATTACHMENTS ──────────────────────────────────────
create table if not exists public.task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.tasks(id) on delete cascade not null,
  file_name   text not null,
  file_path   text not null,
  file_url    text not null,
  file_size   bigint,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists task_attachments_task_idx on public.task_attachments(task_id);


-- ── 9. ROW LEVEL SECURITY ────────────────────────────────────

-- Enable RLS on all tables
alter table public.workspaces         enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.projects           enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_comments      enable row level security;
alter table public.notif_settings     enable row level security;
alter table public.notif_logs         enable row level security;
alter table public.task_attachments   enable row level security;

-- Helper: is the current user a member of this workspace?
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Helper: is the current user the owner of this workspace?
create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id and owner_id = auth.uid()
  );
$$;

-- ── workspaces ──
drop policy if exists "Members can view their workspace"    on public.workspaces;
drop policy if exists "Users can create a workspace"        on public.workspaces;
drop policy if exists "Owner can update workspace"          on public.workspaces;

create policy "Members can view their workspace"
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));

create policy "Users can create a workspace"
  on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owner can update workspace"
  on public.workspaces for update to authenticated
  using (owner_id = auth.uid());

-- ── workspace_members ──
drop policy if exists "Members can view workspace members"     on public.workspace_members;
drop policy if exists "Members can join via invite"            on public.workspace_members;
drop policy if exists "Owner can remove members"               on public.workspace_members;
drop policy if exists "Members can update own record"          on public.workspace_members;

create policy "Members can view workspace members"
  on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can join via invite"
  on public.workspace_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owner can remove members"
  on public.workspace_members for delete to authenticated
  using (public.is_workspace_owner(workspace_id) or user_id = auth.uid());

create policy "Members can update own record"
  on public.workspace_members for update to authenticated
  using (user_id = auth.uid());

-- ── projects ──
drop policy if exists "Members can view projects"    on public.projects;
drop policy if exists "Members can create projects"  on public.projects;
drop policy if exists "Members can update projects"  on public.projects;
drop policy if exists "Members can delete projects"  on public.projects;

create policy "Members can view projects"
  on public.projects for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create projects"
  on public.projects for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update projects"
  on public.projects for update to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete projects"
  on public.projects for delete to authenticated
  using (public.is_workspace_member(workspace_id));

-- ── tasks ──
drop policy if exists "Members can view tasks"    on public.tasks;
drop policy if exists "Members can create tasks"  on public.tasks;
drop policy if exists "Members can update tasks"  on public.tasks;
drop policy if exists "Members can delete tasks"  on public.tasks;

create policy "Members can view tasks"
  on public.tasks for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can create tasks"
  on public.tasks for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Members can update tasks"
  on public.tasks for update to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can delete tasks"
  on public.tasks for delete to authenticated
  using (public.is_workspace_member(workspace_id));

-- ── task_comments ──
drop policy if exists "Members can view comments"    on public.task_comments;
drop policy if exists "Members can post comments"    on public.task_comments;
drop policy if exists "Author can delete comments"   on public.task_comments;

create policy "Members can view comments"
  on public.task_comments for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_comments.task_id
    and public.is_workspace_member(t.workspace_id)
  ));

create policy "Members can post comments"
  on public.task_comments for insert to authenticated
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_comments.task_id
    and public.is_workspace_member(t.workspace_id)
  ));

create policy "Author can delete comments"
  on public.task_comments for delete to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.tasks t
    join public.workspaces w on w.id = t.workspace_id
    where t.id = task_comments.task_id and w.owner_id = auth.uid()
  ));

-- ── notif_settings ──
drop policy if exists "Members can view notif settings"   on public.notif_settings;
drop policy if exists "Owner can manage notif settings"   on public.notif_settings;

create policy "Members can view notif settings"
  on public.notif_settings for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Owner can manage notif settings"
  on public.notif_settings for all to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

-- ── notif_logs ──
drop policy if exists "Members can view notif logs" on public.notif_logs;

create policy "Members can view notif logs"
  on public.notif_logs for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "Members can insert notif logs"
  on public.notif_logs for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- ── task_attachments ──
drop policy if exists "Members can view attachments"    on public.task_attachments;
drop policy if exists "Members can add attachments"     on public.task_attachments;
drop policy if exists "Members can delete attachments"  on public.task_attachments;

create policy "Members can view attachments"
  on public.task_attachments for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_attachments.task_id
    and public.is_workspace_member(t.workspace_id)
  ));

create policy "Members can add attachments"
  on public.task_attachments for insert to authenticated
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_attachments.task_id
    and public.is_workspace_member(t.workspace_id)
  ));

create policy "Members can delete attachments"
  on public.task_attachments for delete to authenticated
  using (created_by = auth.uid() or exists (
    select 1 from public.tasks t
    join public.workspaces w on w.id = t.workspace_id
    where t.id = task_attachments.task_id and w.owner_id = auth.uid()
  ));


-- ── 10. STORAGE BUCKET ───────────────────────────────────────
-- Creates the storage bucket for task file attachments.
-- Run this ONLY if you see "Bucket not found" errors in the app.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  true,
  20971520,  -- 20 MB per file
  array['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'text/plain','text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip']
)
on conflict (id) do nothing;

-- Storage RLS policies
drop policy if exists "Authenticated users can upload attachments"  on storage.objects;
drop policy if exists "Authenticated users can view attachments"    on storage.objects;
drop policy if exists "Authenticated users can delete attachments"  on storage.objects;

create policy "Authenticated users can upload attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'task-attachments');

create policy "Authenticated users can view attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'task-attachments');

create policy "Authenticated users can delete attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'task-attachments' and owner = auth.uid()::text);


-- ============================================================
--  DONE — all tables, RLS, and storage are now set up.
--
--  GOOGLE SIGN-IN (manual step — cannot be done via SQL):
--  ─────────────────────────────────────────────────────
--  1. Go to console.cloud.google.com → Create/select a project
--  2. APIs & Services → OAuth consent screen → External
--     Fill in: App name, support email, your Vercel domain
--  3. APIs & Services → Credentials → OAuth Client ID → Web app
--     Authorised redirect URI: https://<your-project>.supabase.co/auth/v1/callback
--     Authorised origins: https://<your-vercel-domain>.vercel.app
--  4. Supabase Dashboard → Authentication → Providers → Google
--     Paste Client ID + Client Secret → Enable → Save
--  5. Supabase → Authentication → URL Configuration
--     Site URL: https://<your-vercel-domain>.vercel.app
--     Redirect URLs: https://<your-vercel-domain>.vercel.app/**
--
--  Once done, "Continue with Google" on the login page
--  will work automatically — no app code changes needed.
-- ============================================================
