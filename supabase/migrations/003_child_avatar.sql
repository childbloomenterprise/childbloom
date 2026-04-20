-- Add avatar_url column to children table
alter table public.children
  add column if not exists avatar_url text;

-- ── Storage bucket for child avatars ──────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('child-avatars', 'child-avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own child avatars
create policy "Users can upload child avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'child-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own child avatars
create policy "Users can update child avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'child-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own child avatars
create policy "Users can delete child avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'child-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read for avatars (since bucket is public)
create policy "Anyone can view child avatars"
on storage.objects for select
to public
using (bucket_id = 'child-avatars');
