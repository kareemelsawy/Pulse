-- Run this in your Supabase SQL editor to enable email-based workspace invitations

create table if not exists public.workspace_invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email        text not null,
  role         text not null default 'user' check (role in ('owner','pm','user')),
  token        text not null,
  invited_by   text,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (workspace_id, email)
);

-- RLS
alter table public.workspace_invitations enable row level security;

-- Workspace owners/members can read invitations for their workspace
create policy "Members can view invitations"
  on public.workspace_invitations for select
  using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Only workspace owners can insert/delete invitations
create policy "Owners can manage invitations"
  on public.workspace_invitations for all
  using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner')
    )
  );

-- Allow service role (edge functions) to insert
create policy "Service role full access"
  on public.workspace_invitations for all
  to service_role
  using (true);

-- Index for performance
create index if not exists idx_workspace_invitations_workspace
  on public.workspace_invitations(workspace_id);
create index if not exists idx_workspace_invitations_email
  on public.workspace_invitations(email);
create index if not exists idx_workspace_invitations_token
  on public.workspace_invitations(token);
