-- ============================================================
--  PULSE — Fix existing database
--  Run this ONCE in Supabase SQL Editor if you already ran
--  the old setup script. Fixes all known issues.
-- ============================================================

-- ── 1. Fix tasks status constraint ───────────────────────────
alter table tasks drop constraint if exists tasks_status_check;
alter table tasks add constraint tasks_status_check
  check (status in ('new', 'inprogress', 'review', 'done'));

-- Migrate any old status values
update tasks set status = 'new' where status = 'todo';
update tasks set status = 'inprogress' where status = 'in_progress';

-- Fix default for new rows
alter table tasks alter column status set default 'new';

-- ── 2. Create profiles table (for assignee names) ────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Profiles are viewable by all" on profiles;
create policy "Profiles are viewable by all"
  on profiles for select using (true);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (id = auth.uid());

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

-- ── 3. Sync ALL existing users into profiles ─────────────────
insert into profiles (id, full_name, email)
select id, raw_user_meta_data->>'full_name', email
from auth.users
on conflict (id) do update
  set full_name = excluded.full_name,
      email     = excluded.email;

-- ── 4. Create task_comments table ────────────────────────────
create table if not exists task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references tasks(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  body       text not null,
  created_at timestamptz default now()
);

alter table task_comments enable row level security;

drop policy if exists "Members can view comments" on task_comments;
create policy "Members can view comments"
  on task_comments for select
  using (task_id in (
    select id from tasks where workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  ));

drop policy if exists "Members can add comments" on task_comments;
create policy "Members can add comments"
  on task_comments for insert
  with check (user_id = auth.uid());

drop policy if exists "Authors can delete comments" on task_comments;
create policy "Authors can delete comments"
  on task_comments for delete
  using (user_id = auth.uid());

-- ── 5. Update trigger to sync profiles on new signups ────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_workspace_id uuid;
begin
  -- Upsert profile so assignee names always work
  insert into profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do update
    set full_name = excluded.full_name, email = excluded.email;

  -- Only create workspace if user doesn't have one
  if not exists (select 1 from workspace_members where user_id = new.id) then
    insert into workspaces (name, owner_id)
    values (
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Workspace',
      new.id
    )
    returning id into new_workspace_id;

    insert into workspace_members (workspace_id, user_id, role)
    values (new_workspace_id, new.id, 'owner');
  end if;

  return new;
end;
$$;

-- ── Done ──────────────────────────────────────────────────────
-- After running this:
-- ✓ Creating tasks will no longer give a constraint error
-- ✓ Assignee dropdown will show real names instead of user IDs
-- ✓ Comments tab will work on existing tasks
