-- ============================================================
--  PULSE — Link tasks to meetings
--  Run in Supabase SQL Editor after add-meetings-pipeline.sql
-- ============================================================

-- 1. Add meeting_id to tasks (nullable — existing tasks unaffected)
--    ON DELETE SET NULL means deleting a meeting keeps its tasks alive
alter table public.tasks
  add column if not exists meeting_id uuid
    references public.project_meetings(id)
    on delete set null;

create index if not exists tasks_meeting_idx on public.tasks(meeting_id);


-- 2. Add task_count to project_meetings (replaces old action_count)
alter table public.project_meetings
  add column if not exists task_count int default 0;

-- Carry over any existing action_count values then drop the column
update public.project_meetings
  set task_count = action_count
  where action_count is not null;

alter table public.project_meetings
  drop column if exists action_count;


-- 3. Drop the meeting_actions table — no longer needed
drop table if exists public.meeting_actions cascade;


-- ============================================================
--  Done. Safe to re-run.
-- ============================================================
