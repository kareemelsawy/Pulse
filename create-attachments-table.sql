-- ============================================================
--  PULSE — Create task_attachments table
--  Run in: Supabase Dashboard → SQL Editor → New Query
--  Run AFTER create-storage-bucket.sql
-- ============================================================

create table if not exists public.task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,
  file_url    text not null,
  file_size   bigint,
  created_at  timestamptz default now(),
  created_by  uuid references auth.users(id)
);

-- Index for fast lookups by task
create index if not exists task_attachments_task_id_idx on public.task_attachments(task_id);

-- Enable RLS
alter table public.task_attachments enable row level security;

-- Workspace members can view attachments for tasks they can see
create policy "Members can view task attachments"
  on public.task_attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = task_attachments.task_id
        and wm.user_id = auth.uid()
    )
  );

-- Members can insert attachments
create policy "Members can add attachments"
  on public.task_attachments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tasks t
      join public.workspace_members wm on wm.workspace_id = t.workspace_id
      where t.id = task_attachments.task_id
        and wm.user_id = auth.uid()
    )
  );

-- Only the uploader or admin can delete
create policy "Members can delete own attachments"
  on public.task_attachments for delete
  to authenticated
  using (created_by = auth.uid());

-- ============================================================
--  Done. Attachments are now fully enabled.
-- ============================================================
