-- ============================================================
--  PULSE — Run this ONCE in Supabase SQL Editor
--  Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Projects table
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  color       text default '#4F8EF7',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  project_id     uuid references projects(id) on delete cascade not null,
  title          text not null,
  status         text default 'todo' check (status in ('todo','inprogress','review','done')),
  priority       text default 'medium' check (priority in ('high','medium','low')),
  assignee_name  text,
  assignee_email text,
  due_date       date,
  tags           text[] default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Notification settings (one row per user)
create table if not exists notif_settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  gmail_client_id     text,
  gmail_access_token  text,
  gmail_email         text,
  enabled_triggers    jsonb default '{"task_assigned":true,"status_changed":true,"task_completed":true,"new_task":false}',
  notify_assignee     boolean default true,
  extra_emails        text,
  updated_at          timestamptz default now()
);

-- Notification log
create table if not exists notif_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  trigger      text,
  task_title   text,
  project_name text,
  recipients   text[],
  successes    int default 0,
  failures     int default 0,
  created_at   timestamptz default now()
);

-- ── Row Level Security (RLS) ─────────────────────────────────
-- Users can only see/edit their OWN data

alter table projects      enable row level security;
alter table tasks         enable row level security;
alter table notif_settings enable row level security;
alter table notif_logs    enable row level security;

-- Projects policies
create policy "Users manage own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tasks policies
create policy "Users manage own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notif settings policies
create policy "Users manage own notif settings"
  on notif_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notif logs policies
create policy "Users manage own notif logs"
  on notif_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Real-time ────────────────────────────────────────────────
-- Enable real-time for live updates
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;
