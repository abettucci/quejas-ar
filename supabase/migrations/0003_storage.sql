-- ============================================================================
-- Storage bucket for evidence (screenshots, comprobantes)
-- Run AFTER 0002_rls.sql
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- Anyone authenticated can upload
create policy "evidence_upload_authenticated" on storage.objects
  for insert with check (
    bucket_id = 'evidence'
    and auth.uid() is not null
  );

-- Public read (evidence URLs are shown next to posts)
create policy "evidence_read_public" on storage.objects
  for select using (bucket_id = 'evidence');

-- Users can delete their own uploads (path prefixed with user id)
create policy "evidence_delete_own" on storage.objects
  for delete using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
