-- ============================================================
--  PULSE — Create task-attachments Storage Bucket
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  true,
  52428800, -- 50 MB per file
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'application/zip',
    'video/mp4', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

-- 2. Allow authenticated users to upload files
drop policy if exists "Workspace members can upload attachments" on storage.objects;
create policy "Workspace members can upload attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'task-attachments');

-- 3. Allow authenticated users to view/download files
drop policy if exists "Workspace members can view attachments" on storage.objects;
create policy "Workspace members can view attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'task-attachments');

-- 4. Allow users to delete their own uploads only
drop policy if exists "Users can delete own attachments" on storage.objects;
create policy "Users can delete own attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'task-attachments' and owner = auth.uid());

-- ============================================================
--  Done. Files upload to:
--  {SUPABASE_URL}/storage/v1/object/public/task-attachments/{path}
-- ============================================================
