-- ============================================================
--  PULSE — Run this ONCE in Supabase SQL Editor
--  Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── Workspaces ───────────────────────────────────────────────
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  invite_code text unique not null default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at  timestamptz default now()
);

-- ── Workspace members ─────────────────────────────────────────
create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  role         text default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- ── Projects ─────────────────────────────────────────────────
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  created_by   uuid references auth.users(id) on delete set null,
  name         text not null,
  description  text,
  color        text default '#4F8EF7',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── Tasks ────────────────────────────────────────────────────
create table if not exists tasks (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid references workspaces(id) on delete cascade not null,
  project_id     uuid references projects(id) on delete cascade not null,
  created_by     uuid references auth.users(id) on delete set null,
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

-- ── Notification settings ─────────────────────────────────────
create table if not exists notif_settings (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid references workspaces(id) on delete cascade not null unique,
  gmail_client_id     text,
  gmail_access_token  text,
  gmail_email         text,
  enabled_triggers    jsonb default '{"task_assigned":true,"status_changed":true,"task_completed":true,"new_task":false}',
  notify_assignee     boolean default true,
  extra_emails        text,
  updated_at          timestamptz default now()
);

-- ── Notification log ──────────────────────────────────────────
create table if not exists notif_logs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  trigger      text,
  task_title   text,
  project_name text,
  recipients   text[],
  successes    int default 0,
  failures     int default 0,
  created_at   timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────
alter table workspaces        enable row level security;
alter table workspace_members enable row level security;
alter table projects          enable row level security;
alter table tasks             enable row level security;
alter table notif_settings    enable row level security;
alter table notif_logs        enable row level security;

-- Workspaces: members can read, owner can update/delete
create policy "Members can view their workspaces"
  on workspaces for select
  using (id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "Owners can update workspace"
  on workspaces for update
  using (owner_id = auth.uid());

create policy "Users can create workspaces"
  on workspaces for insert
  with check (owner_id = auth.uid());

create policy "Owners can delete workspace"
  on workspaces for delete
  using (owner_id = auth.uid());

-- Workspace members: members can read, anyone can insert themselves (join), owner can remove
create policy "Members can view workspace members"
  on workspace_members for select
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "Users can join workspaces"
  on workspace_members for insert
  with check (user_id = auth.uid());

create policy "Members can leave, owners can remove"
  on workspace_members for delete
  using (user_id = auth.uid() or
         workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Projects: workspace members can do everything
create policy "Workspace members manage projects"
  on projects for all
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Tasks: workspace members can do everything
create policy "Workspace members manage tasks"
  on tasks for all
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Notif settings: workspace members can read, owners can write
create policy "Members can view notif settings"
  on notif_settings for select
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "Owners can manage notif settings"
  on notif_settings for all
  using (workspace_id in (select id from workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Notif logs: workspace members can read
create policy "Members can view notif logs"
  on notif_logs for all
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- ── Real-time ─────────────────────────────────────────────────
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table workspace_members;

-- ── Auto-create workspace on first signup ─────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_workspace_id uuid;
begin
  -- Create a personal workspace
  insert into workspaces (name, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Workspace',
    new.id
  )
  returning id into new_workspace_id;

  -- Add user as owner member
  insert into workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
